import subprocess, sys, re

# 수정된 파일 목록 가져오기
result = subprocess.run(
    ["git", "diff", "--name-only", "HEAD"],
    capture_output=True, text=True
)
# 스테이징 포함
result2 = subprocess.run(
    ["git", "diff", "--name-only", "--cached"],
    capture_output=True, text=True
)
all_files = set(
    (result.stdout.strip() + '\n' + result2.stdout.strip()).split('\n')
)
changed_files = [f for f in all_files if f.strip()]

errors = []
warnings = []

# ── 1. TypeScript 문법 검사 ────────────────────────────────────────────
ts_files = [f for f in changed_files if f.endswith('.ts') or f.endswith('.tsx')]
for f in ts_files:
    r = subprocess.run(["npx", "tsc", "--noEmit", f], capture_output=True, text=True)
    if r.returncode != 0:
        errors.append(f"[TS오류] {f}")

# ── 2. JS/JSX 보안 패턴 검사 ──────────────────────────────────────────
js_files = [f for f in changed_files if f.endswith('.js') or f.endswith('.jsx')]

SECURITY_PATTERNS = [
    # (정규식, 경고 메시지, 심각도)
    (r"Allow-Origin.*\*",       "CORS가 *로 열려있음 → 특정 도메인으로 제한하라", "error"),
    (r"process\.env\.\w+KEY",   "API 키가 클라이언트 코드에 노출 가능", "error"),
    (r"Date\.now\(\).*hash|hash.*Date\.now\(\)", "해시에 Date.now() 사용 → 항상 다른 값 생성됨", "error"),
    (r"getDocs\(query\([^)]+\)\)",  "limit() 없는 getDocs 사용 가능성 → 전체 조회 주의", "warning"),
    (r"conversationHistory\b(?!.*filter|.*map|.*slice)", "conversationHistory 미검증 → 프롬프트 인젝션 위험", "warning"),
    (r"console\.log\(",         "console.log 프로덕션 코드에 남아있음", "warning"),
]

for f in js_files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        for pattern, message, severity in SECURITY_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                entry = f"[{severity.upper()}] {f}: {message}"
                if severity == "error":
                    errors.append(entry)
                else:
                    warnings.append(entry)
    except FileNotFoundError:
        pass  # 삭제된 파일은 무시

# ── 결과 출력 ─────────────────────────────────────────────────────────
if errors:
    print("\n" + "="*60)
    print("[품질 검사 실패] 아래 오류를 즉시 수정하라:")
    for e in errors:
        print(f"  ✗ {e}")
    print("="*60)
    sys.exit(1)  # 오류 시 비정상 종료 → Claude가 인지
elif warnings:
    print("\n[품질 경고] 확인 필요:")
    for w in warnings:
        print(f"  ⚠ {w}")
    print("수정 후 계속 진행하거나, 의도된 코드라면 이유를 명시하라.")
else:
    print("[품질 OK] 보안 패턴 검사 통과")
