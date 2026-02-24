import subprocess, sys

# 수정된 파일에서 기본 문법 오류 체크
result = subprocess.run(
    ["git", "diff", "--name-only"],
    capture_output=True, text=True
)
changed_files = result.stdout.strip().split('\n')

errors = []
for f in changed_files:
    if f.endswith('.ts') or f.endswith('.tsx'):
        r = subprocess.run(["npx", "tsc", "--noEmit", f],
                           capture_output=True, text=True)
        if r.returncode != 0:
            errors.append(f)

if errors:
    print(f"[품질 경고] 오류 발생 파일: {errors}")
    print("즉시 수정하거나 전문 디버깅 세션을 시작하라.")
else:
    print("[품질 OK] 기본 검사 통과")
