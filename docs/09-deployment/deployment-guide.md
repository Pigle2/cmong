# 배포 가이드

## 1. 환경 구성

### 1.1 환경별 사양

| 항목 | Development | Staging | Production |
|------|:-----------:|:-------:|:----------:|
| **ECS API 태스크** | 1대 (0.5 vCPU, 1GB) | 2대 (1 vCPU, 2GB) | 3대+ (2 vCPU, 4GB) |
| **ECS Worker 태스크** | 1대 (0.5 vCPU, 1GB) | 1대 (1 vCPU, 2GB) | 2대+ (1 vCPU, 2GB) |
| **RDS PostgreSQL** | db.t3.small (1 vCPU, 2GB) | db.t3.medium (2 vCPU, 4GB) | db.r6g.large (2 vCPU, 16GB) |
| **RDS Read Replica** | 없음 | 1대 | 2대 |
| **ElastiCache Redis** | cache.t3.micro (1 노드) | cache.t3.small (2 노드) | cache.r6g.large (3 노드) |
| **OpenSearch** | t3.small.search (1 노드) | m6g.large.search (2 노드) | m6g.large.search (3 노드) |
| **S3** | 단일 버킷 | 단일 버킷 | 버킷 + 버전닝 + 복제 |
| **CloudFront** | 미사용 | 기본 설정 | 커스텀 도메인 + WAF |
| **Multi-AZ** | 미적용 | 미적용 | RDS, ElastiCache, ECS 적용 |

### 1.2 도메인 구성

| 환경 | 도메인 | 비고 |
|------|--------|------|
| **Development** | `dev.example.com` | 내부 접근만 허용 |
| **Staging** | `staging.example.com` | IP 화이트리스트 |
| **Production** | `www.example.com` / `api.example.com` | 공개 |

---

## 2. 사전 준비

### 2.1 AWS 리소스 프로비저닝 체크리스트

| # | 리소스 | 설정 항목 | 완료 |
|---|--------|-----------|:----:|
| 1 | **VPC** | CIDR 설계 (10.0.0.0/16), DNS 활성화 | [ ] |
| 2 | **Subnet** | Public 2개 (AZ-a, AZ-c), Private App 2개, Private Data 2개 | [ ] |
| 3 | **Internet Gateway** | VPC 연결 | [ ] |
| 4 | **NAT Gateway** | Public Subnet에 생성 (EIP 할당) | [ ] |
| 5 | **Route Table** | Public: IGW, Private: NAT GW | [ ] |
| 6 | **Security Group** | ALB-SG, ECS-SG, RDS-SG, Redis-SG, OpenSearch-SG | [ ] |
| 7 | **IAM Role** | ECS Task Role, ECS Execution Role, CI/CD Role | [ ] |
| 8 | **ACM** | SSL 인증서 발급 (`*.example.com`) | [ ] |
| 9 | **Route53** | Hosted Zone 생성, 도메인 NS 레코드 설정 | [ ] |
| 10 | **ECR** | 리포지토리 생성 (`cmong-api`, `cmong-worker`, `cmong-web`) | [ ] |
| 11 | **S3** | 파일 저장용 버킷, 로그 저장용 버킷 | [ ] |
| 12 | **KMS** | 데이터 암호화 키 생성 (RDS, S3, 민감 데이터) | [ ] |
| 13 | **CloudWatch** | 로그 그룹 생성, 대시보드 설정 | [ ] |
| 14 | **Secrets Manager** | DB 자격 증명, API 키 등 비밀 값 등록 | [ ] |

### 2.2 Security Group 규칙

| SG 이름 | Inbound | Source | Port |
|---------|---------|--------|:----:|
| **ALB-SG** | HTTPS | 0.0.0.0/0 | 443 |
| | HTTP → HTTPS Redirect | 0.0.0.0/0 | 80 |
| **ECS-SG** | HTTP | ALB-SG | 3000 |
| | WebSocket | ALB-SG | 3000 |
| **RDS-SG** | PostgreSQL | ECS-SG | 5432 |
| | PostgreSQL | Bastion-SG | 5432 |
| **Redis-SG** | Redis | ECS-SG | 6379 |
| **OpenSearch-SG** | HTTPS | ECS-SG | 443 |
| **Bastion-SG** | SSH | 사무실 IP | 22 |

---

## 3. 환경 변수 관리

### 3.1 환경 변수 전체 목록

환경 변수는 AWS Secrets Manager와 ECS Task Definition의 `environment`/`secrets` 섹션으로 관리합니다.

#### 애플리케이션 기본

| 변수명 | 설명 | 예시 (Dev) | 비고 |
|--------|------|-----------|------|
| `NODE_ENV` | 실행 환경 | `development` | `development` / `staging` / `production` |
| `PORT` | 서버 포트 | `3000` | |
| `API_BASE_URL` | API 기본 URL | `https://dev-api.example.com` | |
| `WEB_BASE_URL` | 웹 기본 URL | `https://dev.example.com` | |
| `CORS_ORIGINS` | CORS 허용 도메인 | `https://dev.example.com` | 콤마 구분 |

#### 데이터베이스 (PostgreSQL)

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `DATABASE_URL` | Prisma 연결 문자열 | `postgresql://user:pass@host:5432/dbname?schema=public` |
| `DATABASE_READ_URL` | Read Replica URL | Production만 설정 |
| `DB_POOL_MIN` | 최소 커넥션 | Dev: 2, Staging: 5, Prod: 10 |
| `DB_POOL_MAX` | 최대 커넥션 | Dev: 10, Staging: 20, Prod: 50 |

#### Redis

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `REDIS_HOST` | Redis 호스트 | ElastiCache 엔드포인트 |
| `REDIS_PORT` | Redis 포트 | `6379` |
| `REDIS_PASSWORD` | Redis 비밀번호 | Secrets Manager |
| `REDIS_DB` | Redis DB 번호 | 세션: 0, 캐시: 1, BullMQ: 2 |

#### Elasticsearch / OpenSearch

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `ELASTICSEARCH_URL` | ES 엔드포인트 | OpenSearch 도메인 URL |
| `ELASTICSEARCH_USERNAME` | ES 사용자명 | |
| `ELASTICSEARCH_PASSWORD` | ES 비밀번호 | Secrets Manager |

#### AWS S3

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `AWS_S3_BUCKET` | S3 버킷명 | `cmong-{env}-files` |
| `AWS_S3_REGION` | S3 리전 | `ap-northeast-2` |
| `AWS_CLOUDFRONT_DOMAIN` | CloudFront 도메인 | `cdn.example.com` |

#### 인증 (JWT)

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `JWT_ACCESS_SECRET` | Access Token 시크릿 | Secrets Manager |
| `JWT_ACCESS_EXPIRY` | Access Token 만료 | `15m` |
| `JWT_REFRESH_SECRET` | Refresh Token 시크릿 | Secrets Manager |
| `JWT_REFRESH_EXPIRY` | Refresh Token 만료 | `7d` |

#### PG 결제 (NHN KCP)

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `KCP_SITE_CODE` | KCP 사이트 코드 | 환경별 상이 |
| `KCP_SITE_KEY` | KCP 사이트 키 | Secrets Manager |
| `KCP_GROUP_ID` | KCP 그룹 ID | |
| `KCP_MODE` | KCP 모드 | `test` / `live` |

#### 간편결제

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `KAKAOPAY_CID` | 카카오페이 가맹점 코드 | 환경별 상이 |
| `KAKAOPAY_SECRET_KEY` | 카카오페이 시크릿 키 | Secrets Manager |
| `NAVERPAY_PARTNER_ID` | 네이버페이 파트너 ID | |
| `NAVERPAY_CLIENT_SECRET` | 네이버페이 시크릿 | Secrets Manager |
| `TOSSPAY_CLIENT_KEY` | 토스페이 클라이언트 키 | |
| `TOSSPAY_SECRET_KEY` | 토스페이 시크릿 키 | Secrets Manager |

#### SMS / 알림

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `DANAL_CP_ID` | 다날 CP ID | SMS 발송 |
| `DANAL_CP_PASSWORD` | 다날 CP 비밀번호 | Secrets Manager |
| `KAKAO_ALIMTALK_SENDER_KEY` | 카카오 알림톡 발신 키 | |
| `KAKAO_ALIMTALK_TEMPLATE_CODE` | 알림톡 템플릿 코드 | |

#### 푸시 알림

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `FCM_PROJECT_ID` | Firebase 프로젝트 ID | |
| `FCM_SERVICE_ACCOUNT` | Firebase 서비스 계정 JSON | Secrets Manager |
| `APNS_KEY_ID` | APNs Key ID | iOS 푸시 |
| `APNS_TEAM_ID` | APNs Team ID | |
| `APNS_AUTH_KEY` | APNs Auth Key (.p8) | Secrets Manager |

#### 소셜 로그인 (OAuth)

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 | |
| `KAKAO_CLIENT_SECRET` | 카카오 시크릿 | Secrets Manager |
| `NAVER_CLIENT_ID` | 네이버 클라이언트 ID | |
| `NAVER_CLIENT_SECRET` | 네이버 시크릿 | Secrets Manager |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | |
| `GOOGLE_CLIENT_SECRET` | Google 시크릿 | Secrets Manager |
| `APPLE_CLIENT_ID` | Apple Services ID | |
| `APPLE_TEAM_ID` | Apple Team ID | |
| `APPLE_KEY_ID` | Apple Key ID | |
| `APPLE_PRIVATE_KEY` | Apple Private Key (.p8) | Secrets Manager |

#### 이메일 (AWS SES)

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `SES_REGION` | SES 리전 | `ap-northeast-2` |
| `SES_FROM_EMAIL` | 발신 이메일 | `noreply@example.com` |
| `SES_REPLY_TO_EMAIL` | 수신 이메일 | `support@example.com` |

#### 모니터링

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `SENTRY_DSN` | Sentry DSN | 환경별 상이 |
| `DATADOG_API_KEY` | Datadog API 키 | Secrets Manager |
| `DATADOG_APP_KEY` | Datadog APP 키 | Secrets Manager |
| `LOG_LEVEL` | 로그 레벨 | Dev: `debug`, Staging: `info`, Prod: `warn` |

---

## 4. 인프라 구성 절차 (Terraform)

### 4.1 디렉토리 구조

```
infra/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/
│   ├── rds/
│   ├── elasticache/
│   ├── opensearch/
│   ├── s3/
│   ├── cloudfront/
│   ├── alb/
│   ├── route53/
│   └── monitoring/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   └── production/
├── shared/
│   ├── ecr/
│   └── iam/
└── README.md
```

### 4.2 프로비저닝 단계

| 단계 | 작업 | 명령어 | 비고 |
|:----:|------|--------|------|
| 1 | Terraform 초기화 | `terraform init` | 백엔드(S3) 설정 |
| 2 | 공유 리소스 생성 | ECR, IAM Role | `shared/` 디렉토리 |
| 3 | VPC 생성 | Subnet, IGW, NAT GW, Route Table | |
| 4 | 보안 그룹 생성 | ALB-SG, ECS-SG, RDS-SG 등 | |
| 5 | 데이터 계층 생성 | RDS, ElastiCache, OpenSearch | |
| 6 | 스토리지 생성 | S3 버킷, CloudFront 배포 | |
| 7 | 로드밸런서 생성 | ALB, Target Group, Listener | |
| 8 | ECS 클러스터 생성 | Cluster, Service, Task Definition | |
| 9 | DNS 설정 | Route53 레코드 | |
| 10 | 모니터링 설정 | CloudWatch 대시보드, 알림 | |

```bash
# 환경별 프로비저닝 예시
cd infra/environments/production
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 4.3 상태 관리

| 항목 | 설정 |
|------|------|
| **Backend** | S3 (`cmong-terraform-state`) |
| **Lock** | DynamoDB (`cmong-terraform-locks`) |
| **상태 파일** | 환경별 분리 (`env:/{dev,staging,production}/terraform.tfstate`) |

---

## 5. 데이터베이스 마이그레이션

### 5.1 Prisma Migrate 전략

| 환경 | 마이그레이션 방식 | 명령어 |
|------|:----------------:|--------|
| **Development** | 자동 적용 | `npx prisma migrate dev` |
| **Staging** | 수동 적용 (리뷰 후) | `npx prisma migrate deploy` |
| **Production** | CI/CD 파이프라인 내 자동 적용 | `npx prisma migrate deploy` |

### 5.2 마이그레이션 프로세스

```
1. 스키마 변경
   └── prisma/schema.prisma 수정

2. 마이그레이션 파일 생성 (Dev)
   └── npx prisma migrate dev --name descriptive_name

3. 코드 리뷰
   └── PR에 마이그레이션 SQL 파일 포함하여 리뷰

4. Staging 적용
   └── npx prisma migrate deploy

5. Staging 검증
   └── 기능 테스트, 데이터 정합성 확인

6. Production 적용
   └── 배포 파이프라인에서 자동 실행
```

### 5.3 롤백 절차

| 상황 | 롤백 방법 |
|------|-----------|
| **마이그레이션 실패 (적용 전)** | 마이그레이션 파일 삭제 후 재생성 |
| **마이그레이션 실패 (적용 중)** | 실패한 마이그레이션 수동 롤백 SQL 실행 |
| **마이그레이션 성공 후 문제 발견** | 역방향 마이그레이션 파일 생성하여 적용 |
| **긴급 롤백** | RDS 스냅샷 복원 (RPO 주의) |

> **주의**: Prisma는 공식적으로 down migration을 지원하지 않으므로, 역방향 SQL을 수동 작성하여 `prisma/rollback/` 디렉토리에 보관합니다.

### 5.4 시딩 데이터

| 시딩 유형 | 대상 | 실행 조건 |
|-----------|------|-----------|
| **마스터 데이터** | 카테고리, 시스템 설정 | 최초 배포 시 |
| **테스트 데이터** | 테스트 사용자, 서비스, 주문 | Dev/Staging만 |
| **관리자 계정** | 초기 관리자 계정 | 최초 배포 시 |

```bash
# 시딩 실행
npx prisma db seed               # 마스터 데이터
npx prisma db seed -- --test     # 테스트 데이터 포함 (Dev/Staging)
```

---

## 6. 배포 절차

### 6.1 CI/CD 파이프라인 (GitHub Actions)

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│  Push /  │───▶│  Build   │───▶│   Test    │───▶│  Docker  │───▶│  Deploy   │
│  PR      │    │  & Lint  │    │           │    │  Build   │    │  (ECS)    │
└─────────┘    └──────────┘    └───────────┘    └──────────┘    └───────────┘
                    │               │                │               │
                    ├─ TypeScript   ├─ Unit Test     ├─ Build Image  ├─ Staging
                    │  Compile     ├─ Integration    ├─ Push to ECR  │  (auto)
                    ├─ ESLint      │  Test          └─ Tag: sha     │
                    └─ Prettier    └─ Coverage                      ├─ Production
                                     Check                          │  (manual approval)
                                                                    └─ Blue/Green
```

### 6.2 GitHub Actions 워크플로우 상세

| 단계 | 트리거 | 동작 |
|------|--------|------|
| **PR Check** | PR 생성/업데이트 | Lint + Type Check + Unit Test |
| **Staging Deploy** | `develop` 브랜치 push | Build → Test → Docker → Deploy to Staging |
| **Production Deploy** | `main` 브랜치 push | Build → Test → Docker → Deploy to Production (승인 필요) |
| **Hotfix Deploy** | `hotfix/*` 브랜치 push | Build → Test → Docker → Deploy to Production (자동) |

### 6.3 ECS Blue/Green 배포

```
현재 (Blue)                         신규 (Green)
┌──────────────┐                    ┌──────────────┐
│ ECS Service  │                    │ ECS Service  │
│ (v1.2.3)     │                    │ (v1.2.4)     │
│              │                    │              │
│ Task 1 ──┐  │                    │ Task 1 ──┐  │
│ Task 2   │  │                    │ Task 2   │  │
│ Task 3   │  │                    │ Task 3   │  │
└──────────┼──┘                    └──────────┼──┘
           │                                  │
     ┌─────┴─────┐                     ┌─────┴─────┐
     │ Target    │                     │ Target    │
     │ Group     │ ◀── ALB 전환 ──▶    │ Group     │
     │ (Blue)    │                     │ (Green)   │
     └───────────┘                     └───────────┘
```

**배포 순서:**
1. Green Target Group에 새 Task Definition 배포
2. 헬스체크 통과 대기 (300초)
3. ALB Listener를 Green으로 전환
4. 10분간 모니터링 (에러율, 응답시간)
5. 이상 없으면 Blue 종료 / 이상 발견 시 Blue로 롤백

### 6.4 수동 배포 절차 (긴급 시)

```bash
# 1. Docker 이미지 빌드 및 푸시
docker build -t cmong-api:latest .
docker tag cmong-api:latest {account}.dkr.ecr.ap-northeast-2.amazonaws.com/cmong-api:latest
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin {account}.dkr.ecr.ap-northeast-2.amazonaws.com
docker push {account}.dkr.ecr.ap-northeast-2.amazonaws.com/cmong-api:latest

# 2. ECS 서비스 업데이트
aws ecs update-service --cluster cmong-production --service cmong-api --force-new-deployment

# 3. 배포 상태 확인
aws ecs wait services-stable --cluster cmong-production --services cmong-api
```

---

## 7. 롤백 절차

### 7.1 앱 롤백

| 방법 | 소요 시간 | 상황 |
|------|:---------:|------|
| **Blue/Green 전환** | < 1분 | 배포 직후 문제 발견 (10분 이내) |
| **이전 Task Definition** | 3~5분 | 이전 버전으로 ECS 서비스 업데이트 |
| **이전 Docker 이미지** | 5~10분 | ECR에서 이전 태그 이미지로 배포 |

```bash
# 이전 Task Definition으로 롤백
aws ecs update-service \
  --cluster cmong-production \
  --service cmong-api \
  --task-definition cmong-api:{previous-revision}

# 배포 상태 확인
aws ecs wait services-stable --cluster cmong-production --services cmong-api
```

### 7.2 DB 롤백

| 방법 | RPO | 소요 시간 | 상황 |
|------|:---:|:---------:|------|
| **역방향 마이그레이션** | 0 | 수 분 | 스키마 변경만 롤백 |
| **Point-in-Time Recovery** | 5분 이내 | 30~60분 | 특정 시점으로 복구 |
| **스냅샷 복원** | 스냅샷 시점 | 15~30분 | 일간 자동 스냅샷 |

### 7.3 긴급 핫픽스 프로세스

```
1. 장애 감지
   └── 모니터링 알림 또는 CS 접수

2. 즉시 조치 결정
   ├── 롤백으로 해결 가능? → 롤백 실행
   └── 핫픽스 필요? → 아래 진행

3. 핫픽스 브랜치 생성
   └── git checkout -b hotfix/{issue-id} main

4. 핫픽스 코드 작성 및 테스트
   └── 최소 단위 테스트 + 수동 검증

5. 코드 리뷰 (긴급: 1인 리뷰)
   └── P1 장애 시 구두 리뷰 후 배포

6. Production 배포
   └── hotfix/* 브랜치 → 자동 배포

7. 검증 및 모니터링
   └── 스모크 테스트 + 지표 모니터링

8. develop/main 브랜치 동기화
   └── 핫픽스 내용을 develop에 머지
```

---

## 8. 배포 후 검증

### 8.1 헬스체크 엔드포인트

| 엔드포인트 | 용도 | 확인 항목 | 주기 |
|-----------|------|-----------|:----:|
| `GET /health` | ALB 헬스체크 | 서버 기동 상태 | 30초 |
| `GET /health/ready` | 서비스 준비 상태 | DB + Redis + ES 연결 | 60초 |
| `GET /health/live` | 서비스 생존 상태 | 프로세스 정상 여부 | 10초 |

**응답 형식:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T10:00:00.000Z",
  "version": "1.2.4",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "elasticsearch": "ok"
  }
}
```

### 8.2 스모크 테스트

배포 후 자동 실행되는 핵심 시나리오 검증:

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|-----------|------|-----------|
| 1 | 서버 기동 | `GET /health/ready` | 200 OK, 모든 의존성 정상 |
| 2 | 인증 | `POST /v1/auth/login` | 200 OK, 토큰 발급 |
| 3 | 서비스 목록 조회 | `GET /v1/services` | 200 OK, 데이터 반환 |
| 4 | 검색 | `GET /v1/search?q=디자인` | 200 OK, 검색 결과 반환 |
| 5 | 카테고리 조회 | `GET /v1/categories` | 200 OK, 카테고리 트리 반환 |
| 6 | WebSocket 연결 | Socket.IO 핸드셰이크 | 연결 성공 |
| 7 | 이미지 업로드 | `POST /v1/uploads` (테스트 이미지) | 200 OK, S3 URL 반환 |
| 8 | Static 파일 | CloudFront URL 접근 | 200 OK, 캐시 헤더 확인 |

### 8.3 외부 서비스 연동 확인

| 서비스 | 확인 방법 | 비고 |
|--------|-----------|------|
| **NHN KCP** | 테스트 결제 승인/취소 | Sandbox 모드 |
| **카카오페이** | 결제 준비 API 호출 | Sandbox 모드 |
| **AWS SES** | 테스트 이메일 발송 | 확인용 메일 주소 |
| **다날 SMS** | 테스트 SMS 발송 | 확인용 번호 |
| **카카오 알림톡** | 테스트 메시지 발송 | 테스트 템플릿 |
| **FCM** | 테스트 푸시 발송 | 테스트 디바이스 |
| **소셜 로그인** | OAuth 인증 플로우 | 각 Provider 테스트 계정 |

---

## 9. 재해 복구 (DR)

### 9.1 RPO/RTO 정의

| 리소스 | RPO | RTO | 복구 방법 |
|--------|:---:|:---:|-----------|
| **RDS PostgreSQL** | 5분 | 30분 | Point-in-Time Recovery |
| **ElastiCache Redis** | 1시간 | 15분 | 자동 Failover + 스냅샷 복원 |
| **OpenSearch** | 1시간 | 30분 | 자동 스냅샷 복원 |
| **S3** | 0 (무손실) | 즉시 | 버전닝 + 교차 리전 복제 |
| **ECS** | N/A | 5분 | 자동 재시작 + Auto Scaling |

### 9.2 백업 전략

| 리소스 | 자동 백업 | 수동 백업 | 보존 기간 |
|--------|:---------:|:---------:|:---------:|
| **RDS** | 일 1회 스냅샷 + 5분 WAL | 릴리스 전 수동 스냅샷 | 자동 35일, 수동 무기한 |
| **ElastiCache** | 일 1회 스냅샷 | 필요 시 | 7일 |
| **OpenSearch** | 시간별 자동 스냅샷 | 필요 시 | 14일 |
| **S3** | 버전닝 활성화 | - | Lifecycle 정책 적용 |

### 9.3 S3 교차 리전 복제

```
┌─────────────────┐         복제         ┌─────────────────┐
│  ap-northeast-2 │ ──────────────────▶  │  ap-northeast-1 │
│  (서울, Primary) │                      │  (도쿄, Replica)│
│                 │                      │                 │
│  cmong-prod-    │                      │  cmong-dr-      │
│  files          │                      │  files          │
└─────────────────┘                      └─────────────────┘
```

| 항목 | 설정 |
|------|------|
| **소스 리전** | ap-northeast-2 (서울) |
| **대상 리전** | ap-northeast-1 (도쿄) |
| **복제 범위** | 전체 객체 (신규 + 삭제 마커) |
| **스토리지 클래스** | 대상 리전은 S3 Standard-IA |

### 9.4 장애 시나리오별 대응 절차

#### 시나리오 1: RDS Primary 장애

```
1. CloudWatch 알림 수신 (RDS Failover 이벤트)
2. Multi-AZ 자동 Failover (약 1~2분)
3. 애플리케이션 DB 연결 자동 복구 (DNS 기반)
4. 커넥션 에러 일시 발생 → 재연결 로직으로 복구
5. 모니터링: 복구 후 쿼리 성능, 에러율 확인
```

#### 시나리오 2: 전체 AZ 장애

```
1. ALB가 정상 AZ의 ECS 태스크로 자동 라우팅
2. ECS Auto Scaling이 정상 AZ에 추가 태스크 기동
3. RDS Multi-AZ Failover (다른 AZ의 Standby 승격)
4. ElastiCache Failover (다른 AZ의 레플리카 승격)
5. 검증: 헬스체크 + 스모크 테스트 실행
```

#### 시나리오 3: 리전 전체 장애

```
1. Route53 Health Check 실패 감지
2. DNS Failover → DR 리전 (ap-northeast-1) 전환
3. DR 리전에서 RDS 스냅샷 기반 DB 복원
4. ECS 클러스터 가동 (사전 준비된 Terraform 사용)
5. S3 교차 리전 복제 데이터 사용
6. 검증 후 서비스 재개
```

---

## 10. 성능 튜닝

### 10.1 PostgreSQL 파라미터

| 파라미터 | 기본값 | 권장값 (Production) | 설명 |
|---------|:------:|:-------------------:|------|
| `shared_buffers` | 128MB | 4GB (메모리의 25%) | 공유 메모리 버퍼 |
| `effective_cache_size` | 4GB | 12GB (메모리의 75%) | OS 캐시 포함 예상 크기 |
| `work_mem` | 4MB | 64MB | 정렬/해시 작업 메모리 |
| `maintenance_work_mem` | 64MB | 512MB | VACUUM, CREATE INDEX 등 |
| `max_connections` | 100 | 200 | 최대 동시 연결 |
| `wal_buffers` | -1 | 64MB | WAL 버퍼 크기 |
| `checkpoint_completion_target` | 0.5 | 0.9 | 체크포인트 분산 |
| `random_page_cost` | 4.0 | 1.1 | SSD 기반 랜덤 I/O 비용 |
| `effective_io_concurrency` | 1 | 200 | SSD 병렬 I/O |
| `log_min_duration_statement` | -1 | 200 | 슬로우 쿼리 로깅 (ms) |

### 10.2 Redis 메모리 정책

| 설정 | 값 | 설명 |
|------|:---:|------|
| `maxmemory` | 인스턴스 메모리의 75% | 최대 사용 메모리 |
| `maxmemory-policy` | `allkeys-lru` | 메모리 초과 시 LRU 기반 키 제거 |
| `timeout` | 300 | 유휴 연결 타임아웃 (초) |
| `tcp-keepalive` | 60 | TCP 연결 유지 확인 주기 (초) |
| `hz` | 100 | 이벤트 루프 주기 (초당 횟수) |

**Redis DB별 용도:**

| DB 번호 | 용도 | TTL 정책 |
|:-------:|------|----------|
| 0 | 세션 (JWT Refresh Token) | 7일 |
| 1 | API 캐시 (서비스 목록, 카테고리 등) | 5분 ~ 1시간 |
| 2 | BullMQ 작업 큐 | 작업 완료 후 24시간 |
| 3 | Rate Limiting 카운터 | 1분 |
| 4 | 실시간 데이터 (온라인 상태, 타이핑 등) | 5분 |

### 10.3 Elasticsearch 샤드/레플리카

| 인덱스 | Primary 샤드 | 레플리카 | 리프레시 간격 | 비고 |
|--------|:----------:|:--------:|:----------:|------|
| `services` | 3 | 1 | 10초 | 서비스 검색 |
| `services_autocomplete` | 2 | 1 | 30초 | 자동완성 |
| `users` | 2 | 1 | 30초 | 판매자 검색 |
| `logs-*` | 1 | 0 | 60초 | 로그 (일별 인덱스) |

**인덱스 최적화 설정:**

| 설정 | 값 | 설명 |
|------|:---:|------|
| `index.number_of_replicas` | 1 | 가용성 보장 |
| `index.refresh_interval` | 10s | 준실시간 검색 |
| `index.max_result_window` | 10,000 | 최대 검색 결과 |
| `indices.query.bool.max_clause_count` | 1,024 | Bool 쿼리 최대 절 수 |

### 10.4 ECS 오토스케일링 정책

| 정책 | 대상 | 조건 | 동작 | 쿨다운 |
|------|------|------|------|:------:|
| **CPU 스케일 아웃** | API 서비스 | CPU > 70% (3분) | +1 태스크 | 60초 |
| **CPU 스케일 인** | API 서비스 | CPU < 30% (10분) | -1 태스크 | 300초 |
| **요청 수 기반** | API 서비스 | 태스크당 1,000 req/min | 비례 조정 | 60초 |
| **큐 기반 스케일 아웃** | Worker 서비스 | 대기 큐 > 100건 | +1 태스크 | 120초 |
| **큐 기반 스케일 인** | Worker 서비스 | 대기 큐 < 10건 (10분) | -1 태스크 | 300초 |
| **스케줄 기반** | API 서비스 | 평일 09:00~22:00 | 최소 3대 | - |

---

## 11. 참조

| 참조 문서 | 관련 섹션 |
|-----------|-----------|
| [시스템 아키텍처](../08-system-architecture/architecture.md) | AWS 인프라 구성 (§6), CI/CD (§6.3), 환경 구성 (§6.2) |
| [비기능 요구사항](../12-nfr/non-functional-requirements.md) | SLA/SLO (§3), 오토스케일링 (§2.4), 장애 대응 (§9) |
| [DB 스키마 설계](../06-database-design/database-schema.md) | 마이그레이션 대상 테이블, 인덱스 설계 |
| [API 설계](../07-api-design/api-specification.md) | 헬스체크 엔드포인트, 스모크 테스트 대상 API |
| [결제/정산 기능 명세](../04-feature-spec/payment-settlement.md) | PG 연동 설정, 정산 배치 처리 |
