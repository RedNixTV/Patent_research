Versioning roadmap:

```text
git tag -a v1.1.0 -m "Release v1.1.0"
git tag -a v1.2.0 -m "Release v1.2.0"
git tag -a v1.3.0 -m "Release v1.3.0"
git tag -a v1.4.0 -m "Release v1.4.0"
git tag -a v1.5.0 -m "Release v1.5.0"
```

Example:

```bash
git add .
git commit -m "chore(release): prepare vX.Y.Z release"

git tag -a vX.Y.Z -m "Release vX.Y.Z"

git push origin main
git push origin vX.Y.Z