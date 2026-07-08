package server

import (
	"os"
	"path/filepath"
	"strings"
)

// resolveSafePath joins relativePath under the prototype root and returns the
// absolute target path, verifying it does not escape the root.
//
// This prevents two classes of path-traversal issues that a naive
// strings.HasPrefix check misses:
//   - "../sibling" escaping the root entirely
//   - prefix-confusion: "/data/prototypes-secret" is wrongly accepted as being
//     under "/data/prototypes" by HasPrefix, because the sibling name shares
//     the root as a string prefix.
//
// filepath.Rel produces a ".."-prefixed result for any target outside the root,
// which we reject explicitly.
func (s *Server) resolveSafePath(relativePath string) (string, error) {
	absRoot, err := filepath.Abs(s.prototypeDir)
	if err != nil {
		return "", err
	}
	absTarget, err := filepath.Abs(filepath.Join(s.prototypeDir, filepath.Clean(relativePath)))
	if err != nil {
		return "", err
	}
	rel, err := filepath.Rel(absRoot, absTarget)
	if err != nil {
		return "", os.ErrPermission
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) {
		return "", os.ErrPermission
	}
	return absTarget, nil
}
