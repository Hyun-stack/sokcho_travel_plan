# Travel-map

속초 여행 동선을 권역별로 보여주는 인터랙티브 지도 웹앱입니다. React + Vite + Leaflet으로 만들었고, GitHub Pages로 배포됩니다.

## 기능

- 카페, 맛집, 랜드마크 등 관광 스팟을 5개 권역(색상)으로 구분해 지도에 표시
- 지도 이동/줌에 따라 하단(모바일)/사이드(데스크톱) 패널에 현재 화면에 보이는 장소 목록 자동 갱신
- 즐겨찾기 토글 (localStorage에 저장되어 새로고침해도 유지)
- 즐겨찾기만 보기 필터
- 장소 목록에서 선택 시 지도가 해당 위치로 이동

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 실행 (http://localhost:5173)
npm run build     # tsc 타입 체크 + 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 미리보기
```

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드 후 GitHub Pages에 배포합니다.

## 프로젝트 구조

```
src/
  main.tsx              # 엔트리 포인트
  App.tsx               # 최상위 컴포넌트, 상태(즐겨찾기/패널 확장/보이는 장소) 관리
  types.ts              # Place, ZoneInfo, DestinationData 타입 정의
  data/sokcho.json       # 장소 데이터 (id/이름/좌표/권역/카테고리) — 장소 추가/수정은 여기서
  hooks/useFavorites.ts  # 즐겨찾기 상태 + localStorage 연동 훅
  components/
    MapView.tsx          # Leaflet 지도, 마커 클러스터링, 즐겨찾기 아이콘
    Legend.tsx            # 권역 범례
    Panel.tsx             # 장소 목록 패널 (모바일 바텀시트 / 데스크톱 사이드바)
legacy/                  # 이전 단일 HTML 버전
```

## 데이터 수정

새로운 장소를 추가하거나 수정하려면 `src/data/sokcho.json`의 `places` 배열을 편집하세요. 각 항목은 `id`, `name`, `lat`, `lng`, `zone`, `category`로 구성됩니다. 새로운 권역을 추가할 경우 `zones` 객체에도 색상과 이름을 함께 등록해야 합니다.
