# Windows Symlinks: Complete Guide

## What Are Symlinks?

A **symbolic link** (symlink) is a filesystem pointer that redirects access from one path to another. Unlike shortcuts (`.lnk` files), symlinks are transparent to applications — programs read/write through them as if the target path *is* the link path.

```
C:\Users\You\.config\opencode  -->  D:\work\projects\MyProject\.opencode
        (link)                              (target / real files)
```

Any program accessing `C:\Users\You\.config\opencode\config.json` actually reads `D:\work\projects\MyProject\.opencode\config.json`.

---

## Types of Links on Windows

| Type | Command | Works Across Drives | Target |
|------|---------|---------------------|--------|
| **Directory Symlink** | `mklink /D link target` | Yes | Directories |
| **File Symlink** | `mklink link target` | Yes | Files |
| **Junction** | `mklink /J link target` | No (same volume) | Directories only |
| **Hard Link** | `mklink /H link target` | No (same volume) | Files only |

### When to Use What

- **Directory Symlink (`/D`)** — Best for linking folders across drives. Fully transparent.
- **Junction (`/J`)** — Older alternative. Works without admin but only on the same drive letter.
- **File Symlink** — Link a single file to another location.
- **Hard Link (`/H`)** — Two filenames pointing to the same data on disk. Deleting one doesn't affect the other.

---

## Permissions: The #1 Gotcha

By default, **creating symlinks requires Administrator privileges** on Windows.

### Option A: Run as Administrator

```powershell
# Right-click PowerShell → "Run as administrator"
# Then run mklink commands via cmd:
cmd /c mklink /D "C:\link\path" "D:\target\path"
```

### Option B: Enable Developer Mode (no admin needed for symlinks)

```
Settings → Update & Security → For developers → Developer Mode → ON
```

Once enabled, any user can create symlinks without elevation.

### Option C: Local Security Policy (Pro/Enterprise)

```
secpol.msc → Local Policies → User Rights Assignment
→ "Create symbolic links" → Add your user
```

Requires logoff/logon to take effect.

---

## Creating Symlinks

### Directory Symlink

```powershell
# PowerShell (must use cmd /c because mklink is a cmd built-in)
cmd /c mklink /D "C:\Users\You\.config\opencode" "D:\work\projects\MyProject\.opencode"

# Or from an elevated cmd.exe directly:
mklink /D "C:\Users\You\.config\opencode" "D:\work\projects\MyProject\.opencode"
```

### File Symlink

```powershell
cmd /c mklink "C:\Users\You\.bashrc" "D:\dotfiles\.bashrc"
```

### Junction (no admin needed, same drive only)

```powershell
cmd /c mklink /J "C:\Users\You\Documents\configs" "C:\projects\configs"

# Or using PowerShell natively:
New-Item -ItemType Junction -Path "C:\link" -Target "C:\target"
```

### Hard Link (files only, same drive)

```powershell
cmd /c mklink /H "C:\link\file.txt" "C:\target\file.txt"

# Or PowerShell:
New-Item -ItemType HardLink -Path "C:\link.txt" -Target "C:\target.txt"
```

---

## PowerShell Native Methods

PowerShell 5.1+ supports creating links directly:

```powershell
# Symlink (directory)
New-Item -ItemType SymbolicLink -Path "C:\link\dir" -Target "D:\real\dir"

# Symlink (file)
New-Item -ItemType SymbolicLink -Path "C:\link\file" -Target "D:\real\file"

# Junction
New-Item -ItemType Junction -Path "C:\link\dir" -Target "C:\real\dir"

# Hard link
New-Item -ItemType HardLink -Path "C:\link\file" -Target "C:\real\file"
```

---

## Inspecting Symlinks

### Check if a path is a symlink

```powershell
$item = Get-Item -LiteralPath "C:\Users\You\.config\opencode"
$item.LinkType     # "SymbolicLink", "Junction", "HardLink", or empty
$item.Target       # Where it points
```

### List all symlinks in a directory

```powershell
Get-ChildItem -Path "C:\Users\You" -Force |
    Where-Object { $_.LinkType } |
    Select-Object Name, LinkType, Target
```

### Using dir (cmd)

```cmd
dir /AL C:\Users\You
```

The `<SYMLINK>`, `<JUNCTION>`, or `<SYMLINKD>` tags appear in the listing.

---

## Modifying Symlinks

You **cannot edit a symlink in place**. To change where it points:

```powershell
# 1. Remove the old link (this does NOT delete the target)
Remove-Item -LiteralPath "C:\link\path" -Force

# For directory symlinks/junctions, also use:
(Get-Item -LiteralPath "C:\link\path").Delete()
# This is safer — it only removes the link, never recurses into the target.

# 2. Create new link
New-Item -ItemType SymbolicLink -Path "C:\link\path" -Target "D:\new\target"
```

---

## Removing Symlinks

**CRITICAL:** Deleting a symlink should NOT delete the target files. But be careful with the method:

```powershell
# SAFE: Remove just the link pointer
(Get-Item -LiteralPath "C:\my-symlink").Delete()

# ALSO SAFE for file symlinks:
Remove-Item -LiteralPath "C:\my-file-symlink"

# DANGER with directory symlinks — this can recurse into the target:
Remove-Item -LiteralPath "C:\my-dir-symlink" -Recurse    # DO NOT DO THIS

# SAFE alternative for directory symlinks:
cmd /c rmdir "C:\my-dir-symlink"
# rmdir on a symlink removes the link only, never the contents.
```

### Safe Removal Summary

| Link Type | Safe Command |
|-----------|-------------|
| File Symlink | `Remove-Item -LiteralPath "link"` |
| Directory Symlink | `cmd /c rmdir "link"` or `(Get-Item "link").Delete()` |
| Junction | `cmd /c rmdir "link"` or `(Get-Item "link").Delete()` |

---

## Common Patterns

### Dotfiles on Windows

```powershell
# Keep real configs in a git repo, symlink to expected locations
cmd /c mklink /D "%USERPROFILE%\.config\opencode" "D:\dotfiles\opencode"
cmd /c mklink "%USERPROFILE%\.gitconfig" "D:\dotfiles\.gitconfig"
```

### Shared Config Across Projects

```powershell
# One source of truth, multiple projects reference it
cmd /c mklink /D "D:\project-a\.opencode" "D:\shared-config\.opencode"
cmd /c mklink /D "D:\project-b\.opencode" "D:\shared-config\.opencode"
```

### Moving node_modules to a Faster Drive

```powershell
# Move heavy folder, leave symlink behind
Move-Item -Path ".\node_modules" -Destination "D:\cache\myproject\node_modules"
cmd /c mklink /D "node_modules" "D:\cache\myproject\node_modules"
```

---

## Git and Symlinks

By default, **Git on Windows does NOT follow symlinks** — it stores them as text files containing the target path.

### Enable symlink support in Git

```bash
git config --global core.symlinks true
```

### .gitignore symlinks

If you don't want Git to track the symlink itself:

```gitignore
# Ignore the link, not the target
.opencode
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "You do not have sufficient privilege" | No admin / no dev mode | Enable Developer Mode or run as admin |
| "Cannot create a file when that file already exists" | Link path already exists | Remove existing dir/file first |
| Symlink shows as regular file in Git | `core.symlinks` is false | `git config --global core.symlinks true` |
| `Remove-Item -Recurse` deleted target files | Used `-Recurse` on a dir symlink | Use `cmd /c rmdir` or `.Delete()` instead |
| Junction fails across drives | Junctions are same-volume only | Use `/D` symlink instead |
| Target not found after reboot | Target was on a removable/network drive | Use a stable mount point |

---

## Quick Reference

```powershell
# CREATE
cmd /c mklink /D "link" "target"            # dir symlink
cmd /c mklink "link" "target"               # file symlink
cmd /c mklink /J "link" "target"            # junction (same drive)

# INSPECT
(Get-Item "path").LinkType                   # type
(Get-Item "path").Target                     # where it points

# REMOVE (safe)
cmd /c rmdir "dir-symlink"                   # dir link
Remove-Item "file-symlink"                   # file link

# VERIFY
Test-Path "link"                             # True if target exists
(Get-Item "link").LinkType -eq "SymbolicLink"  # True if symlink
```
