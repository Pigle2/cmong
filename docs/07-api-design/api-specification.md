# REST API 명세

## 1. API 설계 원칙

| 항목 | 규칙 |
|------|------|
| **Base URL** | `https://api.example.com/v1` |
| **프로토콜** | HTTPS only |
| **인증** | Bearer Token (JWT) |
| **형식** | JSON (Content-Type: application/json) |
| **네이밍** | kebab-case (복수형 리소스) |
| **페이징** | offset 기반 (기본) / cursor 기반 (실시간 피드: 채팅 메시지, 알림) |
| **에러 형식** | 커스텀 에러 응답 포맷 (`success`, `error.code`, `error.message`, `error.details`) |
| **API 버전** | URL path 방식 (/v1, /v2) |

---

## 2. 공통 응답 형식

### 2.1 성공 응답

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNext": true
  }
}
```

### 2.2 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다",
    "details": [
      {
        "field": "email",
        "message": "이메일 형식이 올바르지 않습니다"
      }
    ]
  }
}
```

### 2.3 HTTP 상태 코드

| 코드 | 설명 | 용도 |
|------|------|------|
| 200 | OK | 조회/수정 성공 |
| 201 | Created | 생성 성공 |
| 204 | No Content | 삭제 성공 |
| 400 | Bad Request | 유효성 검증 실패 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복 등 충돌 |
| 422 | Unprocessable Entity | 비즈니스 룰 위반 |
| 429 | Too Many Requests | Rate Limit 초과 |
| 500 | Internal Server Error | 서버 오류 |

---

## 3. 인증 API

### 3.1 회원가입

```
POST /v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword1!",
  "nickname": "홍길동",
  "userType": "BUYER",
  "termsAgreed": true,
  "privacyAgreed": true,
  "marketingAgreed": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "nickname": "홍길동",
    "userType": "BUYER"
  }
}
```

### 3.2 로그인

```
POST /v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword1!",
  "rememberMe": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "홍길동",
      "userType": "BUYER",
      "profileImageUrl": null
    }
  }
}
```

### 3.3 소셜 로그인

```
POST /v1/auth/social
```

**Request Body:**
```json
{
  "provider": "KAKAO",
  "accessToken": "kakao_access_token"
}
```

### 3.4 토큰 갱신

```
POST /v1/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 3.5 이메일 인증

```
POST /v1/auth/verify-email
```

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### 3.6 비밀번호 재설정

```
POST /v1/auth/forgot-password
```

```json
{
  "email": "user@example.com"
}
```

```
POST /v1/auth/reset-password
```

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newSecurePassword1!"
}
```

---

## 4. 사용자 API

### 4.1 프로필 조회/수정

```
GET    /v1/users/me                    # 내 정보 조회
PATCH  /v1/users/me                    # 내 정보 수정
GET    /v1/users/:userId               # 사용자 공개 프로필 조회
PATCH  /v1/users/me/password           # 비밀번호 변경
DELETE /v1/users/me                    # 회원 탈퇴
```

### 4.2 판매자 전환

```
POST /v1/users/me/seller-profile
```

**Request Body:**
```json
{
  "sellerType": "INDIVIDUAL",
  "shortBio": "6년차 그래픽 디자이너",
  "specialties": ["로고", "브랜딩", "패키지"],
  "bankName": "국민은행",
  "bankAccount": "123-456-789012",
  "bankHolder": "최유진"
}
```

### 4.3 판매자 프로필

```
GET    /v1/sellers/:sellerId           # 판매자 프로필 조회
PATCH  /v1/sellers/me                  # 판매자 프로필 수정
GET    /v1/sellers/me/stats            # 판매자 통계
```

---

## 5. 서비스 API

### 5.1 서비스 CRUD

```
GET    /v1/services                    # 서비스 목록 (검색/필터)
POST   /v1/services                    # 서비스 등록
GET    /v1/services/:serviceId         # 서비스 상세 조회
PATCH  /v1/services/:serviceId         # 서비스 수정
DELETE /v1/services/:serviceId         # 서비스 삭제
```

### 5.2 서비스 목록 조회

```
GET /v1/services?category=design&q=로고&minPrice=10000&maxPrice=500000&rating=4.5&sort=recommended&page=1&limit=20
```

**Query Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| q | string | 검색 키워드 |
| category | string | 카테고리 slug |
| minPrice | integer | 최소 가격 |
| maxPrice | integer | 최대 가격 |
| rating | number | 최소 평점 |
| workDays | integer | 최대 작업일 |
| sellerGrade | string | 판매자 등급 |
| sort | string | 정렬 (recommended, latest, rating, orders, price_asc, price_desc) |
| page | integer | 페이지 번호 |
| limit | integer | 페이지 크기 (기본 20) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "프리미엄 로고 디자인",
      "shortDescription": "6년차 디자이너가 만드는 로고",
      "thumbnailUrl": "https://...",
      "startPrice": 50000,
      "avgRating": 4.9,
      "reviewCount": 328,
      "orderCount": 156,
      "workDays": 3,
      "seller": {
        "id": 1,
        "nickname": "최유진",
        "grade": "PRO",
        "profileImageUrl": "https://..."
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1234,
    "hasNext": true
  }
}
```

### 5.3 서비스 등록

```
POST /v1/services
```

**Request Body:**
```json
{
  "categoryId": 15,
  "title": "프리미엄 로고 디자인",
  "shortDescription": "6년차 디자이너가 만드는 프로페셔널 로고",
  "description": "<p>상세 설명 HTML...</p>",
  "thumbnailUrl": "https://...",
  "images": ["https://...", "https://..."],
  "tags": ["로고", "브랜딩", "CI"],
  "packages": [
    {
      "packageType": "STANDARD",
      "name": "기본",
      "price": 50000,
      "workDays": 3,
      "revisionCount": 1,
      "description": "로고 시안 1개"
    },
    {
      "packageType": "DELUXE",
      "name": "프리미엄",
      "price": 100000,
      "workDays": 5,
      "revisionCount": 3,
      "description": "로고 시안 3개 + 명함"
    }
  ],
  "options": [
    {
      "name": "시안 추가",
      "price": 20000,
      "extraDays": 1
    }
  ],
  "faqs": [
    {
      "question": "작업 기간은 얼마나 걸리나요?",
      "answer": "패키지별 작업일을 기준으로..."
    }
  ]
}
```

### 5.4 판매자 서비스 관리

```
GET    /v1/sellers/me/services         # 내 서비스 목록
PATCH  /v1/services/:serviceId/status  # 서비스 상태 변경 (판매중지/재개)
POST   /v1/services/:serviceId/clone   # 서비스 복제
```

### 5.5 검색 자동완성

```
GET /v1/services/autocomplete?q=로고
```

---

## 6. 카테고리 API

### 6.1 카테고리 조회

#### 카테고리 목록 (계층형)

```
GET /v1/categories
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:---:|------|
| depth | number | | 조회 깊이 (0: 대분류, 1: 중분류, 2: 소분류). 미지정 시 전체 |
| parentId | number | | 특정 상위 카테고리의 하위 목록 조회 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "디자인",
      "slug": "design",
      "depth": 0,
      "displayOrder": 1,
      "iconUrl": "/icons/design.svg",
      "children": [
        {
          "id": 11,
          "name": "로고/브랜드",
          "slug": "logo-brand",
          "depth": 1,
          "displayOrder": 1,
          "children": [
            {
              "id": 111,
              "name": "로고 디자인",
              "slug": "logo-design",
              "depth": 2,
              "displayOrder": 1
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 7. 주문 API

### 7.1 주문 CRUD

```
POST   /v1/orders                      # 주문 생성
GET    /v1/orders/:orderId             # 주문 상세 조회
GET    /v1/orders/buyer                # 구매자 주문 목록
GET    /v1/orders/seller               # 판매자 주문 목록
```

### 7.2 주문 생성

```
POST /v1/orders
```

**Request Body:**
```json
{
  "serviceId": 1,
  "packageId": 2,
  "optionIds": [1, 3],
  "requirements": "IT 스타트업 로고를 의뢰합니다...",
  "attachmentUrls": ["https://..."],
  "dueDate": "2026-03-09",
  "couponId": 5,
  "pointAmount": 1000
}
```

### 7.3 주문 액션

```
POST   /v1/orders/:orderId/accept      # 판매자 주문 수락
POST   /v1/orders/:orderId/reject      # 판매자 주문 거절
POST   /v1/orders/:orderId/deliver     # 판매자 납품
POST   /v1/orders/:orderId/revision    # 구매자 수정 요청
POST   /v1/orders/:orderId/confirm     # 구매자 구매 확정
POST   /v1/orders/:orderId/cancel      # 주문 취소
POST   /v1/orders/:orderId/extend      # 납기 연장 요청
```

---

## 8. 결제 API

```
POST   /v1/payments                    # 결제 요청 (PG 결제 키 생성)
POST   /v1/payments/confirm            # 결제 승인 (PG 콜백)
POST   /v1/payments/:paymentId/cancel  # 결제 취소/환불
GET    /v1/payments/:paymentId         # 결제 상세 조회
```

### 8.1 결제 요청

```
POST /v1/payments
```

**Request Body:**
```json
{
  "orderId": 1,
  "method": "CARD",
  "amount": 128340
}
```

---

## 9. 정산 API

```
GET    /v1/settlements                 # 정산 내역 조회
GET    /v1/settlements/balance         # 가용 잔액 조회
POST   /v1/settlements/withdraw        # 출금 요청
GET    /v1/settlements/stats           # 정산 통계
```

---

## 10. 채팅 API

### 10.1 REST API

```
GET    /v1/chat/rooms                  # 채팅방 목록
POST   /v1/chat/rooms                  # 채팅방 생성 (문의)
GET    /v1/chat/rooms/:roomId/messages # 메시지 목록
POST   /v1/chat/rooms/:roomId/messages # 메시지 전송
POST   /v1/chat/rooms/:roomId/read     # 읽음 처리
```

### 10.2 WebSocket 이벤트

```
# 연결
wss://api.example.com/v1/chat/ws?token={accessToken}

# 클라이언트 → 서버
{
  "event": "send_message",
  "data": {
    "roomId": 1,
    "messageType": "TEXT",
    "content": "안녕하세요"
  }
}

{
  "event": "typing",
  "data": { "roomId": 1 }
}

# 서버 → 클라이언트
{
  "event": "new_message",
  "data": {
    "id": 100,
    "roomId": 1,
    "senderId": 2,
    "messageType": "TEXT",
    "content": "안녕하세요",
    "createdAt": "2026-03-04T14:30:00Z"
  }
}

{
  "event": "user_typing",
  "data": { "roomId": 1, "userId": 2 }
}

{
  "event": "message_read",
  "data": { "roomId": 1, "userId": 2, "lastReadMessageId": 99 }
}
```

---

## 11. 리뷰 API

```
GET    /v1/services/:serviceId/reviews  # 서비스 리뷰 목록
POST   /v1/orders/:orderId/review       # 리뷰 작성
PATCH  /v1/reviews/:reviewId            # 리뷰 수정
DELETE /v1/reviews/:reviewId            # 리뷰 삭제
POST   /v1/reviews/:reviewId/reply      # 판매자 답변
POST   /v1/reviews/:reviewId/report     # 리뷰 신고
```

---

## 12. 견적 API

```
POST   /v1/quotes                       # 견적 요청 작성
GET    /v1/quotes                       # 견적 요청 목록
GET    /v1/quotes/:quoteId              # 견적 요청 상세
POST   /v1/quotes/:quoteId/propose      # 판매자 견적 제안
POST   /v1/quotes/:quoteId/accept       # 구매자 견적 수락
```

---

## 13. 알림 API

```
GET    /v1/notifications                # 알림 목록
GET    /v1/notifications/unread-count   # 미읽음 알림 수
PATCH  /v1/notifications/:id/read       # 알림 읽음 처리
POST   /v1/notifications/read-all       # 전체 읽음 처리
GET    /v1/notifications/settings       # 알림 설정 조회
PATCH  /v1/notifications/settings       # 알림 설정 수정
```

---

## 14. 찜/쿠폰/포인트 API

```
# 찜
POST   /v1/favorites                    # 찜 추가
DELETE /v1/favorites/:serviceId         # 찜 취소
GET    /v1/favorites                    # 찜 목록

# 쿠폰
GET    /v1/coupons                      # 내 쿠폰 목록
POST   /v1/coupons/register             # 쿠폰 코드 등록

# 포인트
GET    /v1/points                       # 포인트 내역
GET    /v1/points/balance               # 포인트 잔액
```

---

## 15. 파일 업로드 API

```
POST   /v1/uploads/image               # 이미지 업로드
POST   /v1/uploads/file                 # 파일 업로드
```

**Request:** multipart/form-data

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/uploads/2026/03/image.jpg",
    "fileName": "image.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

---

## 16. 관리자 API

```
# 회원 관리
GET    /v1/admin/users                  # 회원 목록
GET    /v1/admin/users/:userId          # 회원 상세
PATCH  /v1/admin/users/:userId/status   # 회원 상태 변경
POST   /v1/admin/users/:userId/warn     # 경고 발송
POST   /v1/admin/users/:userId/suspend  # 계정 정지

# 서비스 심사
GET    /v1/admin/services/pending       # 심사 대기 목록
POST   /v1/admin/services/:id/approve   # 서비스 승인
POST   /v1/admin/services/:id/reject    # 서비스 반려

# 분쟁 관리
GET    /v1/admin/disputes               # 분쟁 목록
GET    /v1/admin/disputes/:id           # 분쟁 상세
POST   /v1/admin/disputes/:id/resolve   # 분쟁 해결

# 정산 관리
GET    /v1/admin/settlements            # 정산 현황
POST   /v1/admin/settlements/process    # 일괄 정산 처리

# 콘텐츠 관리
GET    /v1/admin/banners                # 배너 목록
POST   /v1/admin/banners                # 배너 생성
PATCH  /v1/admin/banners/:id            # 배너 수정
DELETE /v1/admin/banners/:id            # 배너 삭제

# 통계
GET    /v1/admin/stats/revenue          # 매출 통계
GET    /v1/admin/stats/users            # 회원 통계
GET    /v1/admin/stats/orders           # 거래 통계
GET    /v1/admin/stats/dashboard        # 대시보드 요약

# 신고 관리
GET    /v1/admin/reports                # 신고 목록 조회
GET    /v1/admin/reports/:reportId      # 신고 상세 조회
PATCH  /v1/admin/reports/:reportId      # 신고 처리

# 카테고리 관리
GET    /v1/admin/categories             # 카테고리 목록 (관리자용)
POST   /v1/admin/categories             # 카테고리 생성
PATCH  /v1/admin/categories/:categoryId # 카테고리 수정
DELETE /v1/admin/categories/:categoryId # 카테고리 삭제
```

### 16.1 신고 관리 API

#### 신고 목록 조회

```
GET /v1/admin/reports
```

**Query Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| status | string | 신고 상태 (PENDING, REVIEWING, RESOLVED, DISMISSED) |
| targetType | string | 신고 대상 유형 (SERVICE, REVIEW, MESSAGE, USER) |
| page | integer | 페이지 번호 |
| limit | integer | 페이지 크기 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reporterName": "홍길동",
      "targetType": "SERVICE",
      "targetId": 42,
      "reason": "FRAUD",
      "status": "PENDING",
      "createdAt": "2026-03-04T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "hasNext": false
  }
}
```

#### 신고 상세 조회

```
GET /v1/admin/reports/:reportId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "reporter": {
      "id": 10,
      "nickname": "홍길동",
      "email": "hong@example.com"
    },
    "targetType": "SERVICE",
    "targetId": 42,
    "targetContent": { ... },
    "reason": "FRAUD",
    "description": "허위 포트폴리오로 판단됩니다",
    "attachments": ["https://..."],
    "status": "PENDING",
    "createdAt": "2026-03-04T10:00:00Z"
  }
}
```

#### 신고 처리

```
PATCH /v1/admin/reports/:reportId
```

**Request Body:**
```json
{
  "status": "RESOLVED",
  "action": "WARNING",
  "adminNote": "허위 포트폴리오 확인, 경고 처리"
}
```

| action 값 | 설명 |
|-----------|------|
| WARNING | 경고 |
| SUSPEND_7D | 7일 정지 |
| SUSPEND_PERMANENT | 영구 정지 |
| DISMISS | 신고 기각 |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "RESOLVED",
    "action": "WARNING",
    "adminNote": "허위 포트폴리오 확인, 경고 처리",
    "resolvedAt": "2026-03-05T09:00:00Z"
  }
}
```

### 16.2 카테고리 관리 API

#### 카테고리 목록 (관리자용)

```
GET /v1/admin/categories
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "디자인",
      "slug": "design",
      "parentId": null,
      "sortOrder": 1,
      "iconUrl": "/icons/design.svg",
      "isActive": true,
      "children": [ ... ]
    }
  ]
}
```

> 활성/비활성 카테고리를 모두 포함하여 반환합니다.

#### 카테고리 생성

```
POST /v1/admin/categories
```

**Request Body:**
```json
{
  "name": "영상 편집",
  "slug": "video-editing",
  "parentId": 3,
  "sortOrder": 5,
  "iconUrl": "/icons/video.svg",
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "영상 편집",
    "slug": "video-editing",
    "parentId": 3,
    "sortOrder": 5,
    "iconUrl": "/icons/video.svg",
    "isActive": true
  }
}
```

#### 카테고리 수정

```
PATCH /v1/admin/categories/:categoryId
```

**Request Body:**
```json
{
  "name": "영상/모션",
  "slug": "video-motion",
  "parentId": 3,
  "sortOrder": 5,
  "iconUrl": "/icons/video.svg",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "영상/모션",
    "slug": "video-motion",
    "parentId": 3,
    "sortOrder": 5,
    "iconUrl": "/icons/video.svg",
    "isActive": true
  }
}
```

#### 카테고리 삭제

```
DELETE /v1/admin/categories/:categoryId
```

**Response (204):** No Content

**에러 응답 (400) - 하위 카테고리 존재 시:**
```json
{
  "success": false,
  "error": {
    "code": "HAS_CHILDREN",
    "message": "하위 카테고리가 존재하여 삭제할 수 없습니다"
  }
}
```

---

## 17. Rate Limiting

| 대상 | 제한 | 비고 |
|------|------|------|
| 일반 API | 100 req/min | IP + 사용자 기준 |
| 검색 API | 30 req/min | IP 기준 |
| 로그인 | 10 req/min | IP 기준 |
| 파일 업로드 | 20 req/min | 사용자 기준 |
| 관리자 API | 200 req/min | 사용자 기준 |

**Rate Limit 헤더:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709553600
```
