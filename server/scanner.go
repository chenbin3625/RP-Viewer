package server

import (
	"os"
	"path/filepath"
	"strings"
)

type BrowseItem struct {
	Name          string `json:"name"`
	Type          string `json:"type"` // "prototype" or "folder"
	Path          string `json:"path"`
	Icon          string `json:"icon"`
	Description   string `json:"description"`
	HasCustomIcon bool   `json:"hasCustomIcon"`
	ChildCount    int    `json:"childCount,omitempty"`
}

type Breadcrumb struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

type BrowseResponse struct {
	Path        string       `json:"path"`
	Breadcrumbs []Breadcrumb `json:"breadcrumbs"`
	Items       []BrowseItem `json:"items"`
}

func (s *Server) scan(relativePath string) (*BrowseResponse, error) {
	absDir := filepath.Join(s.prototypeDir, filepath.Clean(relativePath))

	// Security: ensure we don't escape the prototype dir
	absProtoDir, _ := filepath.Abs(s.prototypeDir)
	absTarget, _ := filepath.Abs(absDir)
	if !strings.HasPrefix(absTarget, absProtoDir) {
		return nil, os.ErrPermission
	}

	entries, err := os.ReadDir(absTarget)
	if err != nil {
		return nil, err
	}

	resp := &BrowseResponse{
		Path:        relativePath,
		Breadcrumbs: buildBreadcrumbs(relativePath),
		Items:       []BrowseItem{},
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasPrefix(name, ".") || strings.HasPrefix(name, "_") {
			continue
		}

		itemPath := relativePath
		if itemPath == "" {
			itemPath = name
		} else {
			itemPath = itemPath + "/" + name
		}

		fullPath := filepath.Join(absTarget, name)
		item := BrowseItem{
			Name: name,
			Path: itemPath,
		}

		// Check if it's a prototype (has index.html)
		if _, err := os.Stat(filepath.Join(fullPath, "index.html")); err == nil {
			item.Type = "prototype"
		} else {
			item.Type = "folder"
			item.ChildCount = countChildren(fullPath)
		}

		// Read metadata
		readMetadata(fullPath, &item)

		// Check for custom icon
		iconFile := findIcon(fullPath)
		if iconFile != "" {
			item.Icon = "/prototypes/" + itemPath + "/" + iconFile
			item.HasCustomIcon = true
		}

		resp.Items = append(resp.Items, item)
	}

	return resp, nil
}

func buildBreadcrumbs(path string) []Breadcrumb {
	crumbs := []Breadcrumb{{Name: "全部原型", Path: ""}}
	if path == "" {
		return crumbs
	}
	parts := strings.Split(path, "/")
	for i, part := range parts {
		crumbs = append(crumbs, Breadcrumb{
			Name: part,
			Path: strings.Join(parts[:i+1], "/"),
		})
	}
	return crumbs
}

func countChildren(dir string) int {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0
	}
	count := 0
	for _, e := range entries {
		if e.IsDir() && !strings.HasPrefix(e.Name(), ".") && !strings.HasPrefix(e.Name(), "_") {
			count++
		}
	}
	return count
}

func readMetadata(dir string, item *BrowseItem) {
	for _, name := range []string{"README.md", "README.txt"} {
		data, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			continue
		}
		lines := strings.SplitN(strings.TrimSpace(string(data)), "\n", 2)
		if len(lines) > 0 {
			title := strings.TrimSpace(lines[0])
			// Strip markdown heading prefix
			title = strings.TrimLeft(title, "# ")
			if title != "" {
				item.Name = title
			}
		}
		if len(lines) > 1 {
			item.Description = strings.TrimSpace(lines[1])
		}
		return
	}
}

func findIcon(dir string) string {
	for _, name := range []string{"icon.png", "icon.jpg", "icon.svg"} {
		if _, err := os.Stat(filepath.Join(dir, name)); err == nil {
			return name
		}
	}
	return ""
}
