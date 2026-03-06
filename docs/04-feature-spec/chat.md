# 채팅 확장 기능 명세

> 이 문서는 `messaging.md`의 기본 채팅 기능을 보완하는 확장 기능을 정의합니다.

---

## 1. 채팅방 나가기

### 1.1 기능 개요

| 항목 | 내용 |
|------|------|
| **기능명** | 채팅방 나가기 |
| **목적** | 사용자가 불필요한 채팅방을 목록에서 제거하여 채팅 관리 편의성 향상 |
| **사용자** | 구매자, 판매자 |

### 1.2 진입점

| 진입점 | 플랫폼 | 설명 |
|--------|--------|------|
| 채팅 목록 스와이프 | 모바일 | 채팅 목록에서 좌측 스와이프 시 "나가기" 버튼 노출 |
| 더보기(⋮) 메뉴 | PC/모바일 | 채팅방 상단 더보기 메뉴에서 "나가기" 선택 |
| 우클릭 / 길게 누르기 | PC/모바일 | 채팅 목록에서 우클릭(PC) 또는 길게 누르기(모바일) 시 컨텍스트 메뉴 노출 |

### 1.3 비즈니스 룰

| # | 규칙 |
|---|------|
| BR-LEAVE-01 | 진행 중인 주문(PAID, ACCEPTED, IN_PROGRESS, DELIVERED, REVISION_REQUESTED)이 연결된 채팅방은 나가기 불가 |
| BR-LEAVE-02 | 진행 중인 분쟁(OPEN, IN_REVIEW)이 연결된 채팅방은 나가기 불가 |
| BR-LEAVE-03 | 채팅방 나가기 시 기존 메시지 데이터는 삭제되지 않음 (상대방은 기존 대화 내용 열람 가능) |
| BR-LEAVE-04 | 나간 사용자의 채팅 목록에서 해당 채팅방이 제거됨 |
| BR-LEAVE-05 | 나가기 시 상대방에게 "OOO님이 나갔습니다" 시스템 메시지 표시 |
| BR-LEAVE-06 | 상대방이 나간 사용자에게 새 메시지를 보내면, 기존 채팅방이 나간 사용자의 목록에 다시 노출됨 (재입장) |
| BR-LEAVE-07 | 나간 사용자가 서비스 상세에서 "문의하기"를 다시 누르면 기존 채팅방으로 재입장 |
| BR-LEAVE-08 | 양쪽 모두 나간 채팅방은 6개월 후 데이터 정리 대상 |
| BR-LEAVE-09 | 나간 사용자가 재입장 시, 나간 시점 이후 메시지만 표시 |
| BR-LEAVE-10 | PENDING 견적서가 있는 채팅방 나가기 시, 해당 견적서 자동 만료 처리 |

### 1.4 DB 변경

**chat_participants 테이블 컬럼 추가:**

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `left_at` | TIMESTAMP | NULL | 채팅방을 나간 시각 (NULL이면 활성 상태) |
| `rejoined_at` | TIMESTAMP | NULL | 재입장한 시각 (재입장 시 갱신) |

**파생 로직:**

| 조건 | 상태 |
|------|------|
| `left_at IS NULL` | 활성 (채팅방에 참여 중) |
| `left_at IS NOT NULL AND rejoined_at IS NULL` | 나간 상태 |
| `left_at IS NOT NULL AND rejoined_at > left_at` | 재입장 상태 |

---

### 1.5 API 명세

#### 1.5.1 채팅방 나가기 (신규)

```
POST /api/chat/rooms/:roomId/leave
```

**요청:**

| 항목 | 내용 |
|------|------|
| 인증 | Bearer Token (필수) |
| Path Param | `roomId` — 대상 채팅방 ID |
| Body | 없음 |

**응답 — 성공 (200):**

```json
{
  "success": true,
  "data": {
    "roomId": "room_abc123",
    "leftAt": "2026-03-06T10:30:00Z",
    "message": "채팅방에서 나갔습니다."
  }
}
```

**응답 — 실패: 진행 중 주문 존재 (422):**

```json
{
  "success": false,
  "error": {
    "code": "ACTIVE_ORDER_EXISTS",
    "message": "진행 중인 주문이 있어 채팅방을 나갈 수 없습니다.",
    "details": {
      "orderId": "ord_xyz789",
      "orderStatus": "IN_PROGRESS"
    }
  }
}
```

**응답 — 실패: 진행 중 분쟁 존재 (422):**

```json
{
  "success": false,
  "error": {
    "code": "ACTIVE_DISPUTE_EXISTS",
    "message": "진행 중인 분쟁이 있어 채팅방을 나갈 수 없습니다.",
    "details": {
      "disputeId": "dsp_def456",
      "disputeStatus": "IN_REVIEW"
    }
  }
}
```

#### 1.5.2 기존 API 변경

| API | 변경 내용 |
|-----|-----------|
| `GET /api/chat/rooms` | `left_at IS NULL` 또는 `rejoined_at > left_at`인 채팅방만 반환 (활성 참여 중인 방만 목록 노출) |
| `POST /api/chat/rooms` | 동일 상대방과의 나간 채팅방이 존재하면 새 채팅방을 생성하지 않고 기존 채팅방 재입장 처리 (`rejoined_at` 갱신) |
| `POST /api/chat/rooms/:roomId/messages` | 상대방이 나간 상태에서 메시지 전송 시, 상대방의 `rejoined_at`을 현재 시각으로 갱신하여 자동 재입장 처리 |
| `GET /api/chat/rooms/:roomId/messages` | 재입장 사용자는 `left_at` 이후 메시지만 조회 (나가기 전 메시지는 표시하지 않음) |

---

### 1.6 처리 흐름

```
사용자: 나가기 요청
  │
  ▼
서버: 진행 중 주문 확인 ──── 있음 ──▶ 422 ACTIVE_ORDER_EXISTS (나가기 차단)
  │
  │ 없음
  ▼
서버: 진행 중 분쟁 확인 ──── 있음 ──▶ 422 ACTIVE_DISPUTE_EXISTS (나가기 차단)
  │
  │ 없음
  ▼
서버: PENDING 견적서 확인 ── 있음 ──▶ 견적서 자동 만료 처리 (BR-LEAVE-10)
  │
  │
  ▼
서버: chat_participants.left_at = NOW()
  │
  ▼
서버: 시스템 메시지 전송 ("OOO님이 나갔습니다") (BR-LEAVE-05)
  │
  ▼
클라이언트: 채팅 목록에서 해당 채팅방 제거 (BR-LEAVE-04)
```

### 1.7 재입장 흐름

```
케이스 1: 상대방이 새 메시지 전송 (BR-LEAVE-06)
  │
  ▼
서버: 나간 사용자의 rejoined_at = NOW()
  │
  ▼
나간 사용자의 채팅 목록에 채팅방 다시 노출
  │
  ▼
나간 사용자는 left_at 이후 메시지만 조회 (BR-LEAVE-09)

────────────────────────────────────────────

케이스 2: 나간 사용자가 "문의하기" 클릭 (BR-LEAVE-07)
  │
  ▼
서버: 기존 채팅방 조회 → rejoined_at = NOW()
  │
  ▼
기존 채팅방으로 이동 (left_at 이후 메시지만 표시)
```

---

### 1.8 예외 처리

| 시나리오 | 처리 방안 |
|----------|-----------|
| 이미 나간 채팅방에 다시 나가기 요청 | 무시 (멱등성 보장, 200 반환) |
| 나가기 처리 중 네트워크 오류 | 클라이언트에서 재시도 안내 |
| 양쪽 모두 나간 채팅방 | 6개월 후 데이터 정리 배치 처리 (BR-LEAVE-08) |
| 탈퇴한 사용자와의 채팅방 | 기존 로직 유지 (읽기 전용), 나가기는 허용 |
