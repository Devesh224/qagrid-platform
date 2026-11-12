from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent
output = root / "QAGrid_source.zip"
include = [
    "README.md", "VALIDATION.md", "QAGrid_AI_Continuation_Handoff.txt", "compose.yaml", "make_zip.py",
    "docs", "deploy", "postman", "frontend", "environment-registry", "reservation-scheduler", "tests",
]
skip_parts = {".venv", ".git", "__pycache__", ".pytest_cache", "node_modules", "dist", "coverage"}
with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for name in include:
        item = root / name
        files = [item] if item.is_file() else item.rglob("*")
        for path in files:
            if path.is_file() and not any(part in skip_parts or part.startswith('.qa-') for part in path.relative_to(root).parts) and not path.name.startswith('qa-') and not path.name.endswith('.tsbuildinfo'):
                archive.write(path, path.relative_to(root).as_posix())
with ZipFile(output) as archive:
    bad = archive.testzip()
    if bad:
        raise RuntimeError(f"Corrupt ZIP member: {bad}")
    print(f"Created {output} with {len(archive.namelist())} files")
