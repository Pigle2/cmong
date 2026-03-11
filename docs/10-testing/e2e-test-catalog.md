# E2E 테스트 목록

> Playwright 기반 E2E 테스트 카탈로그. 총 **298개 단위 테스트** + **99개 시나리오 테스트** = **397개**.
> 마지막 업데이트: 2026-03-11

## 실행 방법

```bash
# 전체 실행
npx playwright test

# 파일 단위 실행
npx playwright test auth.spec.ts

# 특정 테스트만
npx playwright test -g "A-1"
```

## 테스트 계정

| 역할 | 이메일 | 비밀번호 | 닉네임 |
|------|--------|---------|--------|
| 구매자 | buyer1@test.com | Test1234! | 구매자김철수 |
| 판매자 | seller1@test.com | Test1234! | 디자인마스터 |

---

## 파일별 테스트 목록

### 1. `auth.spec.ts` — 인증 (22개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| **비로그인** | | | |
| A-7 | 로그인 페이지 로드 | - | 이메일/비밀번호/로그인버튼/회원가입 링크 |
| A-8 | 회원가입 페이지 로드 | - | 이메일/닉네임/비밀번호/구매자 라벨 |
| A-9 | 보호 페이지 리다이렉트 | - | /orders, /mypage, /seller/dashboard → /login |
| A-10 | 로그인 실패 - 잘못된 비밀번호 | - | 에러 메시지 표시, 페이지 유지 |
| H-4 | 회원가입 유효성 검증 | - | 빈 폼 제출 시 페이지 유지 |
| H-5 | 비밀번호 찾기 페이지 UI | - | 제목/설명/이메일/버튼/돌아가기 링크 |
| H-6 | 비밀번호 찾기 - 이메일 유효성 | - | 빈 이메일, 잘못된 형식 검증 |
| H-7 | 회원가입 - 비밀번호 불일치 | - | 비밀번호 확인 불일치 시 에러 |
| H-8 | 회원가입 - 약한 비밀번호 | - | 8자 미만 시 에러 |
| H-9 | 회원가입 - 잘못된 이메일 형식 | - | 페이지 유지 |
| **로그인 후** | | | |
| B-1 | 헤더에 아바타 표시 | BUYER | 로그인 후 아바타 아이콘 |
| B-2 | 유저 메뉴 드롭다운 | BUYER | 로그아웃/마이페이지 메뉴 |
| B-3 | 마이페이지 프로필 정보 | BUYER | 닉네임/주문/찜/최근주문 |
| B-4 | 찜 목록 접근 | BUYER | /mypage/favorites |
| B-11 | 로그아웃 동작 | BUYER | 로그아웃 후 보호페이지 접근 차단 |
| B-12 | 로그아웃 후 보호 페이지 차단 | BUYER | 5개 보호 경로 모두 리다이렉트 |
| B-13 | 로그아웃 후 로그인 버튼 표시 | BUYER | 헤더에 로그인 링크 |
| B-14 | 로그아웃 후 뒤로가기 차단 | BUYER | 브라우저 back 시 보호 콘텐츠 미노출 |
| B-15 | 로그아웃 후 재로그인 | BUYER | 재로그인 후 정상 접근 |
| **설정** | | | |
| L-1 | 설정 페이지 로드 | BUYER | 닉네임/소개 필드 |
| L-2 | 닉네임/소개 수정 후 저장 | BUYER | 수정 + 저장 토스트 |
| L-3 | 마이페이지 → 설정 이동 | BUYER | 설정 링크 클릭 |
| **모드 전환** | | | |
| M-1 | 구매자 → 판매자 모드 | BUYER | 전환 후 판매자 메뉴 표시 |
| M-2 | 판매자 → 구매자 모드 | BUYER | 전환 후 구매자 메뉴 표시 |
| M-3 | 모드 전환 새로고침 유지 | BUYER | reload 후 모드 유지 |

---

### 2. `search.spec.ts` — 메인 페이지 검색 (7개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| SRCH-1 | 메인 페이지 검색 입력 필드 존재 | - | Hero 섹션 input + 검색 버튼 |
| SRCH-2 | 검색어 입력 후 Enter → /services?q=검색어 | - | 라우팅 및 URL 파라미터 검증 |
| SRCH-3 | 검색 버튼 클릭 → /services?q=검색어 | - | 버튼 클릭 라우팅 검증 |
| SRCH-4 | 빈 검색어 제출 → /services (q 없이) | - | 빈 query → q 파라미터 미포함 |
| SRCH-5 | /services 페이지 검색바 동작 | - | 검색바 재검색 + URL 업데이트 |
| SRCH-6 | /services?q=기존검색어 → 검색바에 값 채워짐 | - | defaultValue prop 동작 |
| SRCH-7 | 검색 후 재검색 → URL 업데이트 | - | 두 번째 검색어로 URL 변경 확인 |

---

### 3. `service.spec.ts` — 서비스 (20개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| **홈/검색/상세** | | | |
| A-1 | 홈페이지 로드 | - | 히어로/카테고리/인기/신규 서비스 |
| A-2 | 카테고리 아이콘 → 필터링 | - | 클릭 → /services?category= |
| A-3 | 서비스 검색 페이지 | - | 카드 목록 + "총 N개의 서비스" |
| A-4 | 키워드 검색 | - | "로고" 검색 → URL에 q= |
| A-5 | 정렬 변경 | - | 최신순 정렬 |
| A-6 | 서비스 상세 페이지 | - | 패키지/판매자/문의하기 |
| **찜하기** | | | |
| B-7 | 찜하기 토글 | BUYER | 하트 버튼 클릭 토글 |
| **판매자 CRUD** | | | |
| D-2 | 판매자 서비스 목록 | SELLER | /seller/services |
| D-3 | 서비스 등록 폼 표시 | SELLER | 카테고리/기본정보/제목/설명 |
| D-4 | 서비스 등록 입력 | SELLER | 카테고리/제목/설명/가격/작업일 |
| D-9 | 서비스 편집 페이지 접근 | SELLER | 수정 버튼 → 편집 폼 |
| **검색 필터** | | | |
| N-1 | 카테고리 필터 → URL 반영 | - | 클릭 → category= |
| N-2 | 정렬 - 최신순 | - | sort=newest |
| N-3 | 정렬 - 평점순 | - | sort=rating |
| N-4 | 정렬 - 가격 낮은순 | - | sort=price_asc |
| N-5 | 정렬 - 가격 높은순 | - | sort=price_desc |
| N-6 | 카테고리 + 정렬 조합 | - | category + sort 동시 적용 |
| N-7 | 검색 결과 없음 안내 | - | "검색 결과가 없습니다" + 안내 |
| N-9 | 서비스 등록 전체 플로우 | SELLER | 카테고리→제목→설명→가격→제출 |
| N-10 | 서비스 편집 데이터 로드 | SELLER | 기존 제목/설명 로드 + 저장 버튼 |

---

### 3. `order.spec.ts` — 주문 (13개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| **구매자** | | | |
| B-5 | 주문 목록 접근 | BUYER | /orders |
| C-1 | 서비스 상세 → 주문 이동 | BUYER | 주문하기 → /orders/new |
| C-2 | 주문 생성 - 요구사항 + 제출 | BUYER | API로 서비스/패키지 → 주문폼 |
| C-3 | 주문 상세 - 타임라인/상태 | BUYER | 주문번호/주문정보/서비스정보/진행상황 |
| C-4 | 구매자 액션 버튼 표시 | BUYER | 구매확정/수정요청/취소/리뷰 |
| **상태 전이** | | | |
| E-1 | 판매자: 주문 수락 | SELLER | PAID → ACCEPTED |
| E-2 | 판매자: 작업 시작 | SELLER | ACCEPTED → IN_PROGRESS |
| E-3 | 판매자: 납품 | SELLER | IN_PROGRESS → DELIVERED |
| E-4 | 구매자: 구매 확정 | BUYER | DELIVERED → COMPLETED |
| **거절/취소** | | | |
| E-6 | 판매자: 거절 버튼 표시 | SELLER | PAID 상태에서 거절 버튼 |
| E-7 | 구매자: 취소 버튼 표시 | BUYER | PAID/ACCEPTED 상태에서 취소 |
| **수정 요청** | | | |
| I-1 | 수정요청 버튼 표시 | BUYER | DELIVERED 상태 |
| I-2 | 수정요청 메모 입력 | BUYER | 메모 textarea |
| I-3 | 수정요청 주문 상태 확인 | SELLER | 재납품 버튼 |

---

### 4. `chat.spec.ts` — 채팅 (6개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| **기본** | | | |
| B-6 | 채팅 페이지 접근 | BUYER | /chat 로드 |
| B-8 | 서비스 상세 → 문의 → 채팅방 | BUYER | 문의하기 클릭 → /chat |
| B-9 | 채팅방 선택 → 메시지 로드 + 전송 | BUYER | 기존 메시지 로드 + 새 메시지 전송 확인 |
| **실시간 (2 브라우저)** | | | |
| RT-1 | 구매자 → 판매자 실시간 표시 | BUYER+SELLER | 메시지 전송 → 상대방 20초 내 수신 |
| RT-2 | 판매자 → 구매자 실시간 표시 | BUYER+SELLER | 메시지 전송 → 상대방 20초 내 수신 |
| RT-3 | 양방향 연속 메시지 교환 | BUYER+SELLER | 3회 교대 전송, 양쪽 모두 확인 |

---

### 4-1. `chat-leave.spec.ts` — 채팅방 나가기 (6개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| LEAVE-1 | 채팅방 더보기 메뉴에 나가기 옵션 존재 | BUYER | 더보기(⋮) 메뉴에 "나가기" 표시 |
| LEAVE-2 | 나가기 확인 다이얼로그 + 취소 동작 | BUYER | 다이얼로그 표시, 취소 시 채팅방 유지 |
| LEAVE-3 | 채팅방 나가기 → 목록 복귀 + 방 제거 | BUYER | 확인 후 목록 이동, 해당 방 목록에서 제거 |
| LEAVE-4 | 나간 후 상대방에게 시스템 메시지 표시 | BUYER+SELLER | "OOO님이 나갔습니다" 시스템 메시지 확인 |
| LEAVE-5 | 나간 채팅방 → 문의하기 → 재입장 | BUYER | 같은 서비스 문의하기로 채팅방 재진입 |
| LEAVE-6 | 존재하지 않는 roomId leave API → 에러 | BUYER | 에러 응답 형식(success/error) 검증 |

---

### 5. `seller.spec.ts` — 판매자 관리 (5개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| D-1 | 대시보드 - 통계 카드 | SELLER | 등록서비스/진행중/완료/평점 |
| D-5 | 주문 관리 페이지 | SELLER | 진행중/완료 탭 |
| D-6 | 주문 상세 → 액션 버튼 | SELLER | 수락/거절/작업시작/납품 |
| D-7 | 프로필 관리 페이지 | SELLER | 활동명 입력 필드 |
| D-8 | 프로필 저장 | SELLER | 소개 수정 + 저장 |

---

### 6. `review.spec.ts` — 리뷰 (3개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| E-5 | 구매자 리뷰 작성 | BUYER | textarea + 리뷰 제출 |
| J-1 | API: 판매자 리뷰 답글 | SELLER | POST /api/reviews/:id/reply |
| J-2 | 서비스 상세 답글 표시 | - | "판매자 답변" 표시 확인 |

---

### 7. `notification.spec.ts` — 알림 (4개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| B-10 | 알림 벨 아이콘 표시 | BUYER | 헤더 벨 아이콘 클릭 |
| K-1 | API: 알림 목록 조회 | BUYER | GET /api/notifications |
| K-2 | API: 전체 읽음 처리 | BUYER | POST /api/notifications/read-all |
| K-3 | 알림 벨 → 패널 표시 | BUYER | 클릭 → 드롭다운/팝오버 |
| K-4 | 판매자 알림 존재 | SELLER | GET /api/notifications |

---

### 8. `api.spec.ts` — API 엔드포인트 + 보안 (37개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| **API 엔드포인트** | | | |
| F-1 | GET /api/services | - | 서비스 목록 + ACTIVE 상태 |
| F-2 | GET /api/services?q=로고 | - | 검색 |
| F-3 | GET /api/services/:id | - | 상세 + packages |
| F-4 | GET /api/categories | - | 카테고리 목록 (10개 이상) |
| F-5 | GET /api/reviews | - | 리뷰 목록 |
| F-6 | GET /api/services 정렬 | - | newest/rating/orders |
| F-7 | GET /api/services 페이지네이션 | - | page=1, page=2 |
| N-8 | API: 정렬별 응답 검증 | - | recommended/price_asc/price_desc/orders |
| **API 보안** | | | |
| S-1 | 인증 없이 보호 API → 401 | - | /api/favorites, /api/notifications |
| S-2 | 인증 없이 찜 토글 → 401 | - | POST /api/favorites |
| S-3 | 인증 없이 채팅방 생성 → 401 | - | POST /api/chat/rooms |
| S-4 | 잘못된 serviceId → 400 | BUYER | number 타입 전달 |
| S-5 | 잘못된 roomType → 400 | BUYER | 'INVALID' 타입 |
| S-6 | 페이지네이션 limit 100 제한 | - | limit=999 → 100개 이하 |
| S-7 | 존재하지 않는 서비스 → 404 | - | UUID 0 |
| S-8 | 리뷰 serviceId 누락 → 400 | - | GET /api/reviews (파라미터 없이) |
| S-9 | 인증 없이 리뷰 작성 → 401 | - | POST /api/reviews 미인증 |
| S-10 | 인증 없이 주문 생성 → 401 | - | POST /api/orders 미인증 |
| S-11 | 리뷰 작성 - 존재하지 않는 주문 → 404 | BUYER | 악의적 orderId로 리뷰 시도 |
| S-12 | 주문 생성 - 존재하지 않는 서비스 → 404 | BUYER | 악의적 serviceId로 주문 시도 |
| S-13 | 주문 생성 - serviceId 미전달 → 400 | BUYER | BAD_REQUEST 검증 |
| S-14 | 인증 없이 주문 상태 변경 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-15 | 주문 상태 변경 - 허용되지 않은 상태값 → 400 | SELLER | BAD_REQUEST 검증 |
| S-16 | 주문 상태 변경 - status 미전달 → 400 | SELLER | BAD_REQUEST 검증 |
| S-17 | 검색 쿼리 특수문자 필터링 검증 | 없음 | PostgREST 인젝션 방지 |
| S-18 | 잘못된 sort 파라미터 무시 검증 | 없음 | 화이트리스트 검증 |
| S-19 | 회원탈퇴 - 인증 없이 호출 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-20 | 회원탈퇴 - reason 미전달 → 400 | BUYER | BAD_REQUEST 검증 |
| S-21 | 회원탈퇴 - reason 500자 초과 → 400 | BUYER | 입력 길이 제한 검증 |
| S-22 | 주문 취소 - 존재하지 않는 주문 → 404 | BUYER | NOT_FOUND 검증 |
| S-23 | 주문 취소 - 에러 메시지 DB 정보 미노출 | BUYER | 정보 노출 방지 검증 |
| S-24 | 구매확정 - 존재하지 않는 주문 → 404 | BUYER | NOT_FOUND 검증 |
| S-25 | 수정요청 - 인증 없이 호출 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-26 | 찜 추가 - 존재하지 않는 서비스 → 404 | BUYER | NOT_FOUND 검증 |
| S-27 | 서비스 상세 조회 - 조회수 증가/중복 방지 | 없음 | 조회수 원자적 증가 검증 |
| S-28 | 보호 페이지 - 비인증 접근 시 리다이렉트 | 없음 | 인증 가드 검증 |
| S-29 | 잘못된 JSON body 전송 시 400 (500 아님) | 없음 | JSON 파싱 에러 핸들링 |
| S-30 | 채팅방 생성 - serviceId 타입 검증 | BUYER | 입력값 타입 검증 |
| S-31 | 채팅 메시지 전송 - 인증 없이 호출 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-32 | 채팅 메시지 전송 - 빈 내용 시 500 아님 | BUYER | 입력값 검증 확인 |
| S-33 | 서비스 등록 - 인증 없이 호출 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-34 | 서비스 등록 - 필수값 누락 → 400 | SELLER | BAD_REQUEST 검증 |
| S-35 | 서비스 등록 - 잘못된 status 값 거부 | SELLER | status 화이트리스트 |
| S-36 | 프로필 수정 - 인증 없이 호출 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-37 | 프로필 수정 - 닉네임 누락 → 400 | BUYER | BAD_REQUEST 검증 |
| S-38 | 프로필 수정 - bio 500자 초과 → 400 | BUYER | 입력 길이 제한 검증 |
| S-39 | 판매자 프로필 저장 - 인증 없이 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-40 | 판매자 프로필 저장 - 활동명 누락 → 400 | SELLER | BAD_REQUEST 검증 |
| S-41 | 서비스 삭제 - 인증 없이 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-42 | 서비스 삭제 - 존재하지 않는 서비스 → 404 | SELLER | NOT_FOUND 검증 |
| S-43 | 서비스 수정 PUT - 인증 없이 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-44 | 서비스 수정 PUT - 제목 누락 → 400 | SELLER | BAD_REQUEST 검증 |
| S-45 | 서비스 수정 PUT - 존재하지 않는 서비스 → 404 | SELLER | NOT_FOUND 검증 |
| S-46 | 찜 토글 API - 인증 없이 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-47 | 찜 토글 API - serviceId 누락 → 400 | BUYER | BAD_REQUEST 검증 |
| S-48 | 찜 토글 API - 존재하지 않는 서비스 → 404 | BUYER | NOT_FOUND 검증 |
| S-49 | 채팅 메시지 전송 - 나간 방에서 전송 → 403 | BUYER | FORBIDDEN/LEFT_ROOM 검증 |
| S-50 | 채팅 메시지 전송 - 5000자 초과 → 400 | BUYER | 입력 길이 제한 검증 |
| S-51 | 리뷰 답글 - 인증 없이 → 401 | 없음 | UNAUTHORIZED 검증 |
| S-52 | 리뷰 답글 - 답글 내용 누락 → 400 | SELLER | BAD_REQUEST 검증 |
| S-53 | 리뷰 답글 - 존재하지 않는 리뷰 → 403 | SELLER | FORBIDDEN 검증 |
| S-54 | 서비스 등록 - description 10000자 초과 → 400 | SELLER | 입력 길이 제한 검증 |
| S-55 | 주문 생성 - requirements 5000자 초과 → 400 | BUYER | 입력 길이 제한 검증 |
| S-56 | 판매자 프로필 - specialties 항목 50자 초과 → 400 | SELLER | 개별 항목 길이 검증 |
| S-57 | 로그인 리다이렉트 - Open Redirect 방지 | 없음 | `//evil.com` 차단 확인 |
| S-58 | 주문 납품 - delivery_note 2000자 초과 → 400 | SELLER | 입력 길이 제한 검증 |
| S-59 | 주문 취소 - cancel_reason 1000자 초과 → 400 | BUYER | 입력 길이 제한 검증 |
| S-60 | 주문 수정요청 - revision_note 2000자 초과 → 400 | BUYER | 입력 길이 제한 검증 |
| S-61 | 채팅방 생성 - 잘못된 UUID sellerId → 400 | BUYER | UUID 형식 검증 |
| S-62 | 채팅방 생성 - 잘못된 UUID serviceId → 400 | BUYER | UUID 형식 검증 |
| S-63 | 서비스 목록 페이지 - 잘못된 page 파라미터 정상 처리 | - | NaN 방지 |
| S-64 | 서비스 목록 페이지 - 음수 page 파라미터 정상 처리 | - | 음수 페이지 방지 |
| S-65 | 서비스 목록 - 검색어 PostgREST 인젝션 방지 (페이지) | - | 서버 컴포넌트 sanitize |
| S-66 | 서비스 목록 - 잘못된 sort 파라미터로 페이지 정상 렌더링 | - | sort whitelist |
| S-67 | API - 잘못된 page 파라미터 정상 처리 | - | page 음수 보정 |
| S-68 | 카테고리 API - 존재하지 않는 카테고리 slug 빈 결과 | - | 카테고리 필터 검증 |
| S-69 | 서비스 목록 API - 카테고리 필터 + 정렬 조합 | - | 복합 쿼리 검증 |
| S-70 | 서비스 목록 API - 가격 오름차순 정렬 검증 | - | STANDARD 패키지 기준 정렬 |
| S-71 | 서비스 목록 API - 가격 내림차순 정렬 검증 | - | STANDARD 패키지 기준 정렬 |
| S-72 | 주문 생성 - 잘못된 UUID serviceId 시 에러 | BUYER | UUID 형식 검증 |
| S-73 | 주문 생성 - 잘못된 UUID packageId 시 에러 | BUYER | UUID 형식 검증 |
| S-74 | 주문 취소 - 잘못된 UUID 주문 ID 시 에러 | - | UUID 형식 검증 |
| S-75 | 주문 상태변경 - 잘못된 UUID 주문 ID 시 에러 | - | UUID 형식 검증 |
| S-76 | 리뷰 답글 - 잘못된 UUID 리뷰 ID 시 에러 | - | UUID 형식 검증 |
| S-77 | 리뷰 조회 - 유효한 UUID로 빈 결과 | - | 빈 결과 정상 반환 |
| S-78 | 삭제된 서비스 상세 페이지 접근 시 404 | - | DELETED 상태 검증 |
| S-79 | 알림 읽음 처리 API 비인증 시 401 | - | markAllRead API route 사용 검증 |
| S-80 | 서비스 삭제 시 패키지 데이터 정리 확인 | - | service_packages 고아 데이터 방지 |
| S-81 | 회원 탈퇴 API 비인증 시 401 | - | 서버 사이드 active orders 검증 |
| S-82 | 찜 토글 API 비인증 시 401 | - | 찜 인증 검증 |
| S-83 | 찜 토글 API 잘못된 serviceId 시 에러 | - | 찜 입력값 검증 |
| S-84 | auto-confirm API 호출 시 500 미반환 | - | CRON 인증 보호 검증 |
| S-85 | auto-confirm 잘못된 시크릿 → 500 미반환 | - | CRON 시크릿 검증 |
| S-86 | 메인 페이지 보안 헤더 존재 확인 | - | 보안 헤더 적용 검증 |
| S-87 | 찜 API 잘못된 UUID 형식 serviceId 거부 | - | UUID 형식 검증 |
| S-88 | 서비스 목록 API 기본 정렬 일관성 | - | 정렬 로직 통일 검증 |
| S-89 | 채팅 메시지 API 잘못된 roomId UUID 거부 | - | UUID 형식 검증 |
| S-90 | 채팅 나가기 API 잘못된 roomId UUID 거부 | - | UUID 형식 검증 |
| S-91 | 판매자 주문 상세 페이지 비인증 시 리다이렉트 | - | 인증 가드 검증 |
| S-92 | 서비스 등록 API NaN categoryId 거부 | - | Number.isInteger 검증 |
| S-93 | 서비스 등록 API 소수점 categoryId 거부 | - | 정수 검증 |
| S-94 | 회원가입 페이지 접근 가능 | - | 인증 스키마 검증 |

---

### 9. `error.spec.ts` — 에러 케이스 (3개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| H-1 | 존재하지 않는 서비스 → 404 | - | UUID 0 접근 |
| H-2 | 존재하지 않는 페이지 → 404 | - | 임의 경로 |
| H-3 | 빈 검색 결과 | - | 존재하지 않는 키워드 |

---

### 10. `mobile.spec.ts` — 모바일 + UI 엣지케이스 (11개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| **모바일 UI (375x812)** | | | |
| G-1 | 모바일 홈페이지 로드 | - | 히어로 헤딩 |
| G-2 | 모바일 하단 네비게이션 | - | fixed bottom nav |
| G-3 | 모바일 서비스 카드 1열 | - | 카드 표시 |
| G-4 | 로그인 후 하단 네비게이션 | BUYER | 로그인 후 nav |
| G-5 | 모바일 채팅 뒤로가기 | BUYER | 뒤로가기 버튼 → 방 목록 복귀 |
| G-6 | 모바일 서비스 상세 패키지 | - | 패키지 테이블 표시 |
| **UI 엣지케이스** | | | |
| U-1 | 빈 주문 목록 안내 | BUYER | 주문 있으면 목록, 없으면 안내 |
| U-2 | 빈 찜 목록 안내 | BUYER | 찜 있으면 카드, 없으면 안내 |
| U-3 | 로그인 후 헤더 아이콘 존재 | BUYER | SVG 아이콘 버튼 1개 이상 |
| U-4 | 서비스 등록 필수 입력 누락 에러 | SELLER | 빈 폼 제출 시 에러 또는 페이지 유지 |
| U-5 | 설정 저장 성공 토스트 | BUYER | 저장 후 토스트 |

---

### 11. `bugfix-verification.spec.ts` — 버그 수정 검증 (12개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| BF-1 | price_asc 정렬 → 오름차순 | - | 가격 오름차순 검증 |
| BF-2 | price_desc 정렬 → 내림차순 | - | 가격 내림차순 검증 |
| BF-3 | category=design 필터 | - | 디자인 카테고리 서비스 반환 |
| BF-4 | 상위 카테고리 → 하위 포함 | - | 상위 필터가 하위 결과 포함 |
| BF-5 | 채팅 메시지 에러 형식 | - | { code, message } 구조 |
| BF-6 | 같은 판매자 문의 중복 방지 | BUYER | 기존 채팅방 반환 |
| BF-7 | /services?category=design 카드 | - | 서비스 카드 표시 |
| BF-8 | 홈 인기+신규 모두 표시 | - | 양쪽 섹션 + 카드 존재 |
| BF-9 | 알림 벨 → 드롭다운 | BUYER | 클릭 → 팝오버 표시 |
| BF-10 | 문의하기 → 채팅방 메시지 입력란 | BUYER | 채팅 입력창 표시 |
| BF-11 | 서비스 등록 가격 min=1 | SELLER | price input min 속성 |
| BF-12 | 설정 페이지 저장 버튼 | BUYER | 저장 버튼 표시 |

---

### 12. `new-features.spec.ts` — 신규 기능 (35개)

> 배포 전 기능은 자동 스킵 처리 (배포 감지 후 실행)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| **설정 - 비밀번호 변경** | | | |
| L-4 | 비밀번호 변경 섹션 UI | BUYER | 입력란/버튼 표시 |
| L-5 | 현재 비밀번호 미입력 오류 | BUYER | 토스트 에러 메시지 |
| L-6 | 새 비밀번호 8자 미만 오류 | BUYER | 토스트 에러 메시지 |
| L-7 | 새 비밀번호 불일치 오류 | BUYER | 토스트 에러 메시지 |
| L-8 | 현재 비밀번호 틀릴 시 에러 | BUYER | 토스트 에러 메시지 |
| **설정 - 회원 탈퇴** | | | |
| L-9 | 회원 탈퇴 섹션 UI | BUYER | 안내 문구 + 버튼 |
| L-10 | 탈퇴 버튼 → 확인 모달 | BUYER | 모달 표시 |
| L-11 | 탈퇴 모달 - 사유 미선택 에러 | BUYER | 토스트 에러 |
| L-12 | 탈퇴 모달 - 취소 → 닫힘 | BUYER | 모달 닫힘 |
| L-13 | 탈퇴 모달 - 사유 목록 표시 | BUYER | 셀렉트 옵션 확인 |
| **모드 전환** | | | |
| M-4 | 모드 전환 버튼 헤더 표시 | BUYER | 헤더에 버튼 존재 |
| M-5 | 판매자 계정 모드 전환 버튼 | SELLER | 모드 전환 버튼 표시 |
| M-6 | 판매자 모드 전환 클릭 동작 | BUYER | dashboard 이동 or 모달 |
| M-7 | 구매자 모드 전환 클릭 동작 | SELLER | mypage 이동 or 모드변경 |
| M-8 | 미등록 판매자 → 등록 안내 모달 | BUYER | 모달 + 등록하기 버튼 |
| **판매자 주문 상세** | | | |
| SEL-10 | 주문 상세 기본 구조 | SELLER | 서비스/주문/구매자 정보 |
| SEL-11 | 주문번호(ORD-) 표시 | SELLER | 주문번호 텍스트 |
| SEL-12 | 진행 타임라인 표시 | SELLER | 타임라인 카드 |
| SEL-13 | 목록으로 돌아가기 링크 | SELLER | 링크 클릭 → 목록 이동 |
| SEL-14 | 구매자 메시지 링크 | SELLER | 링크 표시 |
| SEL-15 | 처리 가능 상태 주문 처리 카드 | SELLER | 주문 처리 카드 존재 |
| **주문 취소 API** | | | |
| ORD-10 | 취소 API 미인증 → 401 | - | 에러 코드 UNAUTHORIZED |
| ORD-11 | 취소 API 사유 5자 미만 → 400 | BUYER | BAD_REQUEST |
| ORD-12 | 취소 API 없는 주문 → 404 | BUYER | NOT_FOUND |
| **납품 처리 API** | | | |
| ORD-13 | 납품 API 미인증 → 401 | - | UNAUTHORIZED |
| ORD-14 | 납품 API 없는 주문 → 404 | SELLER | NOT_FOUND |
| ORD-15 | 납품 API 구매자 시도 → 403 | BUYER | FORBIDDEN |
| **구매 확정 API** | | | |
| ORD-16 | 구매확정 API 미인증 → 401 | - | UNAUTHORIZED |
| ORD-17 | 구매확정 API 없는 주문 → 404 | BUYER | NOT_FOUND |
| ORD-18 | 구매확정 API 판매자 시도 → 403 | SELLER | FORBIDDEN |
| **자동 구매 확정 API** | | | |
| ORD-19 | 자동확정 API 응답 형식 검증 | - | success + confirmed 필드 |
| **주문 취소 모달 UI** | | | |
| ORD-20 | 취소 버튼 → 모달 표시 | BUYER | 모달 + 사유 입력란 |
| ORD-21 | 취소 모달 5자 미만 → 비활성화 | BUYER | 확인 버튼 disabled |
| ORD-22 | 취소 모달 환불 정보 표시 | BUYER | "환불" 텍스트 |
| **납품 처리 UI** | | | |
| ORD-23 | 납품 메시지 입력란 표시 | SELLER | IN_PROGRESS에서 표시 |

---

### 13. `order-new-api.spec.ts` — 주문 페이지 API route 검증 (5개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| ORD-API-1 | 쿼리 파라미터 없이 접근 시 로딩 상태 표시 | BUYER | serviceId 없을 때 로딩 메시지 |
| ORD-API-2 | 유효한 serviceId로 접근 시 /api/services/ 요청 발생 | BUYER | 클라이언트가 API route 사용 검증 (배포 감지) |
| ORD-API-3 | 존재하지 않는 serviceId → 에러 토스트 + 홈 리다이렉트 | BUYER | API 404 → 홈으로 이동 |
| ORD-API-4 | 비로그인 접근 시 리다이렉트 | - | 미들웨어 인증 가드 |
| ORD-API-5 | /api/services/:id API ACTIVE 서비스 반환 확인 | BUYER | 상태/패키지 포함 응답 검증 |

---

### 14. `review-data-api.spec.ts` — 리뷰 데이터 API route 보안 검증 (8개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| RVW-API-1 | 비로그인 접근 시 401 반환 | - | UNAUTHORIZED 코드 검증 |
| RVW-API-2 | 잘못된 UUID 형식 → 400 또는 401 (500 아님) | - | UUID 검증 + 인증 검증 |
| RVW-API-3 | 로그인 후 잘못된 UUID 형식 → 400 | BUYER | BAD_REQUEST + 유효하지 않은 메시지 |
| RVW-API-4 | 로그인 후 존재하지 않는 UUID → 404 | BUYER | NOT_FOUND 코드 검증 |
| RVW-API-5 | 판매자가 타인 주문 접근 → 403 또는 404 | SELLER | 소유권 검증 |
| RVW-API-6 | 에러 응답 형식 { success, error: { code, message } } | - | 표준 에러 구조 + DB 정보 미노출 |
| RVW-API-7 | 리뷰 페이지가 review-data API 통해 조회 (네트워크 확인) | BUYER | 클라이언트 API route 사용 검증 |
| RVW-API-8 | 특수문자 ID 처리 (SQL 인젝션 방지) | BUYER | 500 아님, 400/404 반환 |

---

### 16. `service-detail-gallery.spec.ts` — 서비스 상세 이미지 갤러리 (3개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| GAL-1 | 서비스 상세 페이지에 이미지 갤러리 영역이 표시됨 | - | aspect-video 래퍼 + 이미지 또는 🎨 아이콘 |
| GAL-2 | 이미지 2개 이상 시 이전/다음 화살표 버튼 표시 | - | aria-label 버튼 + "N / M" 인덱스 배지 |
| GAL-3 | 화살표 클릭 시 이미지 인덱스 표시 변경 | - | 다음→인덱스 변경, 이전→복귀 확인 |

> 이미지가 1개 이하인 서비스에서는 GAL-2/GAL-3이 자동 스킵 처리됨 (단일 이미지 시 화살표/인디케이터 숨김이 올바른 동작)

---

### 17. `service-card-workdays.spec.ts` — 서비스 카드 작업일 표시 (2개)

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| CRD-1 | 서비스 목록(/services)에서 카드에 작업일이 표시됨 | - | "N일 이내" 텍스트 또는 카드 렌더링 확인 |
| CRD-2 | 작업일 텍스트 형식이 "N일 이내" 패턴 | - | 정규식 검증, 미배포 시 API work_days 필드 대체 검증 |

> 서비스 패키지 work_days 데이터가 없을 경우 API 직접 검증으로 폴백. Clock 아이콘과 함께 표시.

---

### 19. `service-filters.spec.ts` — 서비스 필터 바 확장 (9개)

> 배포 전 기능(가격/작업일/평점 Select)은 자동 스킵 처리. FLT-4, FLT-9는 배포 여부 무관하게 항상 실행.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| FLT-1 | 가격 범위 필터 Select 표시 | - | 사이드바 Select + '가격' 헤딩 |
| FLT-2 | 작업일 필터 Select 표시 | - | 사이드바 Select + '작업일' 헤딩 |
| FLT-3 | 평점 필터 Select 표시 | - | 사이드바 Select + '평점' 헤딩 |
| FLT-4 | 검색 결과 건수 표시 | - | "서비스" 또는 "건" 텍스트 존재 |
| FLT-5 | 가격 필터 → URL maxPrice 반영 | - | ~50,000원 선택 → maxPrice= |
| FLT-6 | 작업일 필터 → URL workDays 반영 | - | 3일 이내 선택 → workDays=3 |
| FLT-7 | 평점 필터 → URL minRating 반영 | - | 4.0 이상 선택 → minRating=4 |
| FLT-8 | 필터 초기화 버튼 동작 | - | 초기화 클릭 → 파라미터 제거 |
| FLT-9 | 검색어 후 결과 건수 텍스트 형식 | - | /services?q=디자인 → 건/서비스 텍스트 |

---

### 20. `category-dropdown.spec.ts` — GNB 카테고리 드롭다운 (7개)

> 배포 전 기능(헤더 카테고리 버튼)은 자동 스킵 처리.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| CAT-1 | 헤더에 "카테고리" 버튼 존재 | - | GNB nav 카테고리 버튼 표시 |
| CAT-2 | 카테고리 버튼 클릭 → 드롭다운 열림 | - | role="menu" 표시 |
| CAT-3 | 드롭다운에 카테고리 항목 표시 | - | role="menuitem" 1개 이상 |
| CAT-4 | 항목 클릭 → /services?category= 이동 | - | slug URL 라우팅 |
| CAT-5 | /services 페이지 헤더에도 표시 | - | 서비스 목록 페이지에서도 버튼 존재 |
| CAT-6 | 카테고리 버튼에 ChevronDown SVG 포함 | - | 아이콘 SVG 존재 확인 |
| CAT-7 | 드롭다운 외부 클릭 시 닫힘 | - | body 클릭 → 메뉴 비표시 |

---

### 21. `service-detail-tabs.spec.ts` — 서비스 상세 탭 메뉴 (5개)

> 탭 UI가 배포되기 전에는 TAB-1~5 전체 자동 스킵 처리. 배포 후 재실행 시 full 검증.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| TAB-1 | 서비스 상세 페이지에 탭 메뉴가 표시됨 | - | role="tablist" + 탭 2개 이상 |
| TAB-2 | "서비스 소개" 탭이 기본 선택됨 | - | aria-selected="true" 탭 텍스트 확인 |
| TAB-3 | "리뷰" 탭 클릭 시 리뷰 내용이 표시됨 | - | 탭 클릭 → aria-selected + tabpanel 표시 |
| TAB-4 | "포트폴리오" 탭이 존재함 | - | 포트폴리오 탭 존재 확인 |
| TAB-5 | "FAQ" 탭이 존재함 | - | FAQ 탭 존재 확인 |

---

### 22. `view-toggle.spec.ts` — 그리드/리스트 뷰 토글 (3개)

> 뷰 토글 UI가 배포되기 전에는 VW-1, VW-2 자동 스킵 처리. VW-3는 view=list URL 파라미터로 항상 실행.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| VW-1 | /services 페이지에 그리드/리스트 토글 버튼이 표시됨 | - | aria-label 버튼 또는 view= 링크 존재 |
| VW-2 | 리스트 뷰 버튼 클릭 시 URL에 view=list가 추가됨 | - | 클릭 → URL ?view=list 반영 |
| VW-3 | view=list일 때 리스트형 카드가 표시됨 | - | ?view=list 접근 → 카드 렌더링 + URL 유지 |

---

### 24. `related-services.spec.ts` — 관련 서비스 섹션 (2개)

> 동일 카테고리 ACTIVE 서비스가 2개 이상일 때만 섹션 표시. 현재 각 카테고리에 서비스 1개씩 → skip 처리.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| REL-1 | 서비스 상세에 "관련 서비스" 헤딩 표시 | - | 같은 카테고리 서비스 있을 때 h2 표시 확인 |
| REL-2 | 관련 서비스 섹션에 카드 최대 4개 표시 | - | grid 내 서비스 카드 1~4개 존재 확인 |

---

### 25. `hero-banner.spec.ts` — 히어로 배너 슬라이더 (5개)

> HeroBanner 클라이언트 컴포넌트 배포 전에는 HERO-1~4 자동 스킵. HERO-5는 검색바로 폴백 검증.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| HERO-1 | 메인 페이지에 배너 영역 표시 | - | 배너 section + 타이틀 텍스트 확인 |
| HERO-2 | 배너에 이전/다음 화살표 버튼 존재 | - | aria-label "이전 배너" / "다음 배너" 버튼 |
| HERO-3 | dot 인디케이터 3개 표시 | - | aria-label "N번 배너로 이동" 버튼 3개 |
| HERO-4 | 화살표 클릭 시 배너 타이틀 변경 | - | 다음 클릭 → 다른 타이틀 표시 |
| HERO-5 | 검색바가 배너 안에 포함됨 | - | 배너 section 내 input + 검색 라우팅 |

---

### 26. `order-progress.spec.ts` — 주문 프로그레스 바 (2개)

> OrderProgressBar 서버 컴포넌트 배포 전에는 자동 스킵. 배포 후 5단계 레이블 및 상태별 표시 검증.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| PROG-1 | 주문 상세에 프로그레스 바 영역 존재 | BUYER | 5단계 레이블 / 취소 메시지 확인 (미배포 시 주문 상세 접근만 확인) |
| PROG-2 | 프로그레스 바 단계 레이블 검증 | BUYER | 현재 주문 상태에 맞는 활성 레이블 확인 (미배포 시 주문번호 표시만 확인) |

---

### 28. `mypage-enhancements.spec.ts` — 마이페이지 UI 개선 (5개)

> 진행중/완료 분리 배포 전에는 MY-ENH-1~4 자동 스킵. MY-ENH-5는 항상 실행 (배포 버전 무관).

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| MY-ENH-1 | 마이페이지에 "진행중" 주문 수가 표시됨 | BUYER | 진행중 카드 숫자 표시 확인 (미배포 시 스킵) |
| MY-ENH-2 | 마이페이지에 "완료" 주문 수가 표시됨 | BUYER | 완료 카드 숫자 표시 확인 (미배포 시 스킵) |
| MY-ENH-3 | 진행중/완료 별도 카드로 분리 표시 | BUYER | grid-cols-4 카드 4개 (미배포 시 스킵) |
| MY-ENH-4 | 판매자 등급 배지 표시 | SELLER | sellerProfile.grade 있을 때 Badge 렌더링 (등급 없으면 스킵) |
| MY-ENH-5 | 마이페이지 기본 구조 접근 가능 | BUYER | 닉네임/찜/리뷰/최근주문 항상 확인 |

---

### 29. `popular-experts.spec.ts` — 메인 페이지 인기 전문가 섹션 (4개)

> seller_profiles 데이터가 없거나 미배포 시 EXP-1~4 자동 스킵.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| EXP-1 | 메인 페이지에 "인기 전문가" 섹션이 표시됨 | - | h2 "인기 전문가" 헤딩 표시 확인 |
| EXP-2 | 인기 전문가 섹션에 카드 표시 (프로필/닉네임) | - | /sellers/{uuid} 링크 + p.font-semibold 닉네임 |
| EXP-3 | 전문가 카드에 등급 배지와 평점이 표시됨 | - | Badge(등급) + 평점 숫자(0~5) |
| EXP-4 | 전문가 카드 링크 형식 검증 | - | href=/sellers/{UUID} 패턴 확인 |

---

### 30. `package-tabs.spec.ts` — 패키지 탭 UI + 판매자 응답률 (7개)

> 패키지 탭 UI(PKG-1~4)는 `package-comparison.tsx` 탭 형태 배포 전에는 자동 스킵.
> 판매자 응답률(SEL-TAB-1~3)은 `seller_profiles.response_time` 데이터 없을 경우 스킵.
> PKG-3는 배포 여부와 무관하게 항상 실행 ("구매하기" 또는 "주문하기" 중 하나 표시 검증).

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| PKG-1 | 패키지 탭 표시 (STANDARD/DELUXE/PREMIUM) | - | 탭 버튼 1개 이상 + 패키지 레이블 검증 (미배포 시 스킵) |
| PKG-2 | 탭 클릭 시 해당 패키지 정보(가격) 표시 | - | 탭 전환 → text-2xl 가격 표시 (미배포 시 스킵) |
| PKG-3 | "구매하기" 또는 "주문하기" 버튼 표시 | - | 탭 UI "구매하기" 또는 테이블 UI "주문하기" 중 하나 이상 존재 |
| PKG-4 | 로그인 후 "구매하기" 클릭 → 주문 페이지 이동 | BUYER | /orders/new?service=&package= URL 확인 (미배포 시 스킵) |
| SEL-TAB-1 | 서비스 상세 사이드바에 판매자 응답률 텍스트 표시 | - | "응답률 높음/보통/낮음" (response_time null 시 스킵) |
| SEL-TAB-2 | 판매자 응답률 + 평균 응답시간(분) 동시 표시 | - | "응답률 N" + "평균 N분" 텍스트 동시 확인 |
| SEL-TAB-3 | 응답률이 있는 서비스 순회 검증 | - | 서비스 목록 최대 5개 순회, response_time 있는 판매자 발견 시 텍스트 검증 |

---

### 31. `notification-tabs.spec.ts` — 알림 팝오버 탭 필터 (6개)

> 알림 탭 UI(`notification-bell.tsx` 탭 필터)는 배포 전에는 NTF-TAB-2~6 자동 스킵.
> NTF-TAB-1(팝오버 열림)은 배포 여부와 무관하게 항상 실행.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| NTF-TAB-1 | 알림 벨 클릭 시 알림 팝오버가 열림 | BUYER | 벨 클릭 → Radix Popover + "알림" 헤딩 표시 |
| NTF-TAB-2 | 알림 팝오버에 탭 필터 표시 (전체/주문/메시지/시스템) | BUYER | 4개 탭 button 모두 표시 (미배포 시 스킵) |
| NTF-TAB-3 | 탭 클릭 시 active 스타일(text-primary) 적용 | BUYER | "주문" 탭 클릭 → className에 text-primary 포함 |
| NTF-TAB-4 | 각 탭 클릭 시 알림 없음 or 목록 표시됨 | BUYER | 4개 탭 순서대로 클릭 → "알림이 없습니다" 또는 알림 아이템 확인 |
| NTF-TAB-5 | 판매자도 알림 팝오버 탭 필터 사용 가능 | SELLER | 판매자 헤더 벨 클릭 → 4개 탭 표시 확인 |
| NTF-TAB-6 | "전체" 탭이 기본 선택 상태로 표시됨 | BUYER | 팝오버 열릴 때 "전체" 탭 text-primary 클래스 확인 |

---

### 32. `quote-page.spec.ts` — 견적 요청 페이지 (5개)

> /quote 페이지 및 GNB 견적요청 링크 신규 기능. 배포 전에는 QT-1~5 모두 자동 스킵.

| ID | 테스트 | 로그인 | 설명 |
|----|--------|:------:|------|
| QT-1 | /quote 페이지 접근 시 견적 요청 폼이 표시됨 | - | /quote 진입 → 폼 태그 + 견적 헤딩 텍스트 존재 (미배포 시 스킵) |
| QT-2 | GNB에 "견적요청" 링크가 존재함 | - | header 내 "견적요청" 텍스트 링크 표시 + 클릭 가능 (미배포 시 스킵) |
| QT-3 | 견적요청 링크 클릭 시 /quote 페이지로 이동 | - | GNB 링크 클릭 → URL /quote 이동 + 404 아님 확인 (미배포 시 스킵) |
| QT-4 | 폼에 필수 입력 필드들이 존재함 (제목, 상세 내용) | - | 제목 input + 상세 내용 textarea 존재 확인 (미배포 시 스킵) |
| QT-5 | "견적 요청하기" 버튼이 표시됨 | - | type="submit" 버튼 또는 "견적 요청하기" 텍스트 버튼 (미배포 시 스킵) |

---

### 27. `full-scenario.spec.ts` — 통합 시나리오 (99개)

위 단위 테스트 파일들의 시나리오를 순서대로 연결한 전체 플로우 테스트.
`full-scenario.spec.ts`는 단위 파일들과 동일한 테스트 ID를 사용하며, 하나의 파일에서 전체 시나리오를 순차 실행.

---

## 도메인별 분류 요약

| 도메인 | 파일 | 테스트 수 | 주요 범위 |
|--------|------|:---------:|-----------|
| 인증 | auth.spec.ts | 25 | 로그인/가입/로그아웃/설정/모드전환 |
| 메인 검색 | search.spec.ts | 7 | Hero 검색바/Enter/버튼/빈값/rehydration |
| 서비스 | service.spec.ts | 20 | 홈/검색/상세/CRUD/필터 |
| 주문 | order.spec.ts | 14 | 목록/생성/상태전이/거절/수정요청 |
| 채팅 | chat.spec.ts | 6 | 기본채팅 + 실시간(RT) |
| 채팅 나가기 | chat-leave.spec.ts | 6 | 나가기 UI/다이얼로그/성공/시스템메시지/재입장/API |
| 판매자 | seller.spec.ts | 5 | 대시보드/주문/프로필 |
| 리뷰 | review.spec.ts | 3 | 리뷰작성/답글 |
| 알림 | notification.spec.ts | 5 | 벨아이콘/API/패널 |
| API | api.spec.ts | 57 | 엔드포인트 + 보안 |
| 에러 | error.spec.ts | 3 | 404/빈 결과 |
| 모바일 | mobile.spec.ts | 11 | 반응형 + 엣지케이스 |
| 버그수정 | bugfix-verification.spec.ts | 12 | API/UI 버그 수정 검증 |
| 신규기능 | new-features.spec.ts | 35 | 설정개선/모드전환/판매자주문상세/주문취소/납품/자동확정 |
| 주문 API 보안 | order-new-api.spec.ts | 5 | 주문 페이지 클라이언트→API route 전환 검증 |
| 리뷰 API 보안 | review-data-api.spec.ts | 8 | review-data API route 인증/UUID/소유권 검증 |
| 이미지 갤러리 | service-detail-gallery.spec.ts | 3 | 갤러리 영역/화살표 버튼/인덱스 전환 |
| 카드 작업일 | service-card-workdays.spec.ts | 2 | "N일 이내" 형식 표시 검증 |
| 서비스 필터 바 | service-filters.spec.ts | 9 | 가격/작업일/평점 Select + 건수 표시 + 초기화 |
| GNB 카테고리 드롭다운 | category-dropdown.spec.ts | 7 | 헤더 카테고리 드롭다운 UI/라우팅 |
| 서비스 상세 탭 메뉴 | service-detail-tabs.spec.ts | 5 | 탭 UI/기본선택/리뷰탭/포트폴리오/FAQ (미배포 시 스킵) |
| 그리드/리스트 뷰 토글 | view-toggle.spec.ts | 3 | 토글 버튼/URL 반영/리스트 카드 (미배포 시 VW-1,2 스킵) |
| 관련 서비스 섹션 | related-services.spec.ts | 2 | 서비스 상세 하단 동일 카테고리 4개 그리드 (데이터 의존 스킵) |
| 히어로 배너 슬라이더 | hero-banner.spec.ts | 5 | 메인 3개 배너/화살표/dot/검색바 (미배포 시 HERO-1~4 스킵) |
| 주문 프로그레스 바 | order-progress.spec.ts | 2 | 주문 상세 5단계 바 + 취소 메시지 (미배포 시 스킵) |
| 마이페이지 UI 개선 | mypage-enhancements.spec.ts | 5 | 진행중/완료 분리/판매자 등급 배지 (미배포 시 스킵) |
| 인기 전문가 섹션 | popular-experts.spec.ts | 4 | 메인 전문가 카드/닉네임/배지/평점/링크 (미배포 시 스킵) |
| 패키지 탭 UI + 응답률 | package-tabs.spec.ts | 7 | 탭 STANDARD/DELUXE/PREMIUM/구매하기/응답률 텍스트 (미배포 시 일부 스킵) |
| 알림 팝오버 탭 필터 | notification-tabs.spec.ts | 6 | 팝오버 열림/전체주문메시지시스템 탭/active 스타일 (미배포 시 스킵) |
| 견적 요청 페이지 | quote-page.spec.ts | 5 | /quote 폼/GNB 링크/필수 필드/제출 버튼 (미배포 시 스킵) |
| 통합 | full-scenario.spec.ts | 99 | 전체 플로우 |

## 관련 파일 실행 가이드

변경한 기능에 따라 관련 테스트만 실행:

| 변경 영역 | 실행할 테스트 |
|-----------|-------------|
| 인증/로그인/가입 | `auth.spec.ts` |
| 메인 페이지 검색바 | `search.spec.ts` |
| 서비스 검색/필터/CRUD | `service.spec.ts` |
| 주문 플로우 | `order.spec.ts` |
| 채팅 | `chat.spec.ts`, `chat-leave.spec.ts` |
| 판매자 관리 | `seller.spec.ts` |
| 리뷰 | `review.spec.ts` |
| 알림 | `notification.spec.ts` |
| API 엔드포인트 | `api.spec.ts` |
| 에러 처리 | `error.spec.ts` |
| 모바일/반응형 | `mobile.spec.ts` |
| 설정/모드전환/주문취소/납품/자동확정 | `new-features.spec.ts` |
| 주문 페이지 클라이언트→API 전환 | `order-new-api.spec.ts` |
| 리뷰 데이터 API route 보안 | `review-data-api.spec.ts` |
| 서비스 상세 이미지 갤러리 | `service-detail-gallery.spec.ts` |
| 서비스 카드 작업일 표시 | `service-card-workdays.spec.ts` |
| 서비스 필터 바 (가격/작업일/평점/건수) | `service-filters.spec.ts` |
| GNB 카테고리 드롭다운 | `category-dropdown.spec.ts` |
| 서비스 상세 탭 메뉴 | `service-detail-tabs.spec.ts` |
| 그리드/리스트 뷰 토글 | `view-toggle.spec.ts` |
| 서비스 상세 관련 서비스 섹션 | `related-services.spec.ts` |
| 히어로 배너 슬라이더 | `hero-banner.spec.ts` |
| 주문 프로그레스 바 | `order-progress.spec.ts` |
| 마이페이지 진행중/완료 분리 + 판매자 등급 배지 | `mypage-enhancements.spec.ts` |
| 메인 페이지 인기 전문가 섹션 | `popular-experts.spec.ts` |
| 패키지 탭 UI + 판매자 응답률 텍스트 | `package-tabs.spec.ts` |
| 알림 팝오버 탭 필터 (전체/주문/메시지/시스템) | `notification-tabs.spec.ts` |
| 견적 요청 페이지 (/quote) | `quote-page.spec.ts` |
| 커밋 전 전체 검증 | 전체 실행 |
