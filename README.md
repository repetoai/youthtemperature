# 청춘의 온도 — 캠페인 사이트

『청춘의 온도』(충북대학교 사회과학대학 × 레페토 AI) 홈페이지입니다.
정적 HTML 한 장 + "온도 남기기"용 서버리스 API 하나로 구성되어 있어 Vercel에 무료로 배포할 수 있습니다.

```
index.html      사이트 본체 (온도의 들판, 다섯 목소리, 온도 재기, 온도 남기기, 책 소개)
episodes.js   에피소드 54편 — 온도·제목·전문. 온도나 문장을 고치려면 이 파일만 수정
cover.jpg       표지 일러스트
api/notes.js    온도 남기기 저장·조회 API (Upstash Redis)
```

## 배포하기 (약 10분)

### 1. GitHub에 올리기
1. github.com 에서 새 저장소를 만듭니다 (예: `cheongchun-ondo`, Public/Private 무관).
2. 이 폴더의 파일을 모두 올립니다. 터미널을 쓰신다면:
   ```bash
   git init
   git add .
   git commit -m "청춘의 온도 사이트"
   git branch -M main
   git remote add origin https://github.com/<계정>/cheongchun-ondo.git
   git push -u origin main
   ```
   터미널이 익숙하지 않다면 GitHub 저장소 페이지의 **Add file → Upload files** 로 폴더째 끌어다 놓아도 됩니다 (`api` 폴더 포함).

### 2. Vercel에 연결하기
1. vercel.com 에 GitHub 계정으로 로그인합니다.
2. **Add New → Project** 에서 방금 만든 저장소를 **Import** 합니다.
3. Framework Preset은 **Other** 그대로 두고, 아무것도 바꾸지 않은 채 **Deploy** 를 누릅니다.
4. 1분 뒤 `https://cheongchun-ondo.vercel.app` 같은 주소가 나옵니다. 사이트는 이 시점부터 열립니다.
   (아직 "온도 남기기"는 저장되지 않고 "이 화면에만 남겼어요"로 동작합니다.)

### 3. 온도 남기기 저장소 붙이기 (Upstash Redis, 무료)
1. Vercel 프로젝트 화면 → **Storage** 탭 → **Create Database** → **Upstash for Redis** 선택 → 무료 플랜으로 생성.
2. 생성 화면에서 이 프로젝트에 **Connect** 합니다. 환경변수(`KV_REST_API_URL`, `KV_REST_API_TOKEN` 등)가 자동으로 들어갑니다.
3. **Deployments** 탭에서 최신 배포의 **⋯ → Redeploy** 를 한 번 눌러줍니다.
4. 이제 남긴 한 줄이 모든 방문자에게 보이고, 온도의 들판에 점으로 떠오릅니다.

> Upstash 무료 플랜은 하루 1만 요청까지 가능하며, 이 사이트는 방문자당 30초에 1번 조회하므로 충분합니다.
> 기록은 최신 500건까지 보관하고, 같은 IP는 20초에 1건만 남길 수 있습니다.

### 4. 도메인 연결 (선택)
Vercel 프로젝트 → **Settings → Domains** 에서 보유한 도메인을 추가하고, 안내대로 DNS를 설정하면 됩니다.

## 수정하기
- **에피소드 온도·제목·본문**: `episodes.js` 을 고치고 GitHub에 커밋하면 Vercel이 자동으로 다시 배포합니다.
  - `t` 온도, `p` 책의 시작 쪽수, `title` 제목, `paras` 본문 (`p` 문단, `h` 소제목, `q` 장 앞 인용구)
- **온도 재기 문항**: `index.html` 안의 `const Q=[ ... ]` 부분
- **남긴 기록 지우기**: Vercel Storage 탭의 Upstash 콘솔에서 `ondo:notes` 키를 삭제

## 로컬에서 미리 보기
```bash
npm i -g vercel
npm install
vercel dev
```
`http://localhost:3000` 에서 확인할 수 있습니다. Redis 없이도 열리며, 남기기는 화면 내에서만 동작합니다.
