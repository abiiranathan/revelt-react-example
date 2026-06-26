package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"maps"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/abiiranathan/revelt/health"
	"github.com/abiiranathan/revelt/revelt"
)

const (
	// SSReveltConfig is the name of the revelt project config file.
	SSReveltConfig = "revelt.json"

	// SideCarScript is the compiled Node.js render server bundle.
	SideCarScript = "render-server.cjs"

	// ClientDir is the subdirectory of OutDir that holds browser assets.
	ClientDir = "client"

	// jsonPlaceholderPostsURL is the upstream API used to demonstrate
	// server-side data fetching on the /posts route.
	jsonPlaceholderPostsURL = "https://jsonplaceholder.typicode.com/posts?_limit=20"
)

// post mirrors the JSONPlaceholder post schema and is passed as a prop
// to the App island on the /posts route.
type post struct {
	ID     int    `json:"id"`
	UserID int    `json:"userId"`
	Title  string `json:"title"`
	Body   string `json:"body"`
}

func main() {
	cfg, err := revelt.LoadConfig(SSReveltConfig)
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	sidecarPath := filepath.Join(cfg.OutDir, SideCarScript)

	renderer, err := revelt.New(ctx, sidecarPath,
		revelt.WithWorkers(cfg.Workers),
		revelt.WithRenderTimeout(time.Duration(cfg.TimeoutMS)*time.Millisecond),
		revelt.WithProjectConfig(cfg),
	)
	if err != nil {
		log.Fatalf("failed to start revelt: %v", err)
	}
	defer renderer.Close()

	// Shared HTTP client for server-side upstream fetches.
	httpClient := &http.Client{Timeout: 5 * time.Second}

	mux := http.NewServeMux()

	mux.Handle("/healthz", health.Liveness(renderer))
	mux.Handle("/readyz", health.Readiness(renderer))

	clientAssetsDir := filepath.Join(cfg.OutDir, ClientDir)
	staticFS := http.FileServer(http.Dir(clientAssetsDir))
	mux.Handle(cfg.StaticPrefix, http.StripPrefix(cfg.StaticPrefix, staticFS))

	// renderPage is the shared handler logic: it renders the App island with
	// the given activePath and optional extra props, then injects the result
	// into the HTML shell template.
	renderPage := func(w http.ResponseWriter, r *http.Request, activePath string, extraProps map[string]any) {
		indexHTML, err := os.ReadFile(indexPagePath(cfg))
		if err != nil {
			http.Error(w, "index.html not found: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Merge activePath with any route-specific props (e.g. posts).
		props := make(map[string]any, len(extraProps)+1)
		maps.Copy(props, extraProps)
		props["activePath"] = activePath

		appShell, err := renderer.Render(r.Context(), revelt.RenderInput{
			Component: "App",
			Props:     props,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		t, err := template.New("index").Parse(string(indexHTML))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		buf := new(bytes.Buffer)
		if err = t.Execute(buf, map[string]any{
			"AppShell":     template.HTML(appShell.HTML),
			"StaticPrefix": cfg.StaticPrefix,
		}); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write(buf.Bytes())
	}

	// / and /analytics are pure client-state pages; the server only needs
	// to supply the activePath so the App island can mount the right view.
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {

		// Fall through even for 404 for a PURE SPA experience.
		renderPage(w, r, r.URL.Path, nil)
	})

	mux.HandleFunc("/analytics", func(w http.ResponseWriter, r *http.Request) {
		renderPage(w, r, "/analytics", nil)
	})

	// /posts fetches upstream data server-side and passes it as a prop so
	// the first paint is fully populated without a client-side waterfall.
	mux.HandleFunc("/posts", func(w http.ResponseWriter, r *http.Request) {
		posts, err := fetchPosts(r.Context(), httpClient)
		if err != nil {
			// Degrade gracefully: render the page without pre-fetched data;
			// the PostsPage component will perform a client-side fetch instead.
			log.Printf("[posts] upstream fetch failed, degrading to client-side fetch: %v", err)
			renderPage(w, r, "/posts", nil)
			return
		}
		renderPage(w, r, "/posts", map[string]any{"posts": posts})
	})

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Application running on http://localhost:%d", cfg.Port)

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failure: %v", err)
		}
	}()

	<-ctx.Done()
	stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}

// fetchPosts retrieves up to 20 posts from JSONPlaceholder.
// It is called by the /posts handler to pre-populate the App island's props.
func fetchPosts(ctx context.Context, client *http.Client) ([]post, error) {
	req, err := http.NewRequestWithContext(ctx,
		http.MethodGet, jsonPlaceholderPostsURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("upstream GET: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("upstream returned HTTP %d", resp.StatusCode)
	}

	var posts []post
	if err := json.NewDecoder(resp.Body).Decode(&posts); err != nil {
		return nil, fmt.Errorf("decode JSON: %w", err)
	}
	return posts, nil
}

// indexPagePath returns the absolute path to the built index.html file.
func indexPagePath(cfg *revelt.ProjectConfig) string {
	return filepath.Join(cfg.OutDir, ClientDir, "index.html")
}
