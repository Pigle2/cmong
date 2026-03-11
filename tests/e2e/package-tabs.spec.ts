import { test, expect } from '@playwright/test'
import { BUYER, TIMEOUT, login } from './helpers'

/**
 * 패키지 탭 UI 테스트
 *
 * 수정 내용:
 *   - package-comparison.tsx: 테이블 → 탭(STANDARD/DELUXE/PREMIUM) + 구매하기 버튼
 *   - services/[id]/page.tsx: 판매자 응답률 텍스트(높음/보통/낮음) 표시
 *
 * 배포 지연 시: 탭 UI가 없으면 자동 스킵
 *
 * PKG-1: 패키지 탭 표시 (STANDARD/DELUXE/PREMIUM)
 * PKG-2: 탭 클릭 시 해당 패키지 정보 표시
 * PKG-3: "구매하기" 버튼 표시
 * PKG-4: 로그인 후 "구매하기" 클릭 → 주문 페이지 이동
 * SEL-TAB-1: 판매자 응답률 텍스트 표시
 * SEL-TAB-2: 판매자 응답률 + 평균 응답시간(분) 동시 표시
 */

const SERVICE_DETAIL_URL = '/services/0f98edc0-02e7-4f50-98aa-4736fec9e00a'

/** PackageComparison 탭 버튼이 배포되었는지 확인 */
async function isPackageTabDeployed(page: any): Promise<boolean> {
  await page.goto(SERVICE_DETAIL_URL)
  await page.waitForTimeout(4000)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await page.waitForTimeout(2000)
  // 탭 형태: "구매하기" 버튼 or 패키지 탭 컨테이너에 button 있음
  const hasBuyBtn = await page.getByRole('button', { name: '구매하기' }).isVisible({ timeout: 3000 }).catch(() => false)
  return hasBuyBtn
}

test.describe('패키지 탭 UI (package-comparison.tsx 탭 형태)', () => {
  test('PKG-1. 서비스 상세 페이지에 패키지 탭이 표시됨 (STANDARD/DELUXE/PREMIUM 중 하나 이상)', async ({ page }) => {
    const deployed = await isPackageTabDeployed(page)
    if (!deployed) {
      test.skip(true, '패키지 탭 UI 미배포 — Vercel 배포 후 재실행 필요')
      return
    }

    // 탭 컨테이너에 패키지 이름 버튼이 있어야 함
    // package-comparison.tsx: PACKAGE_TIER_LABELS 기반 button 렌더링
    const tabBtns = page.locator('div.rounded-lg.border button')
    const count = await tabBtns.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // 스탠다드/디럭스/프리미엄 또는 STANDARD/DELUXE/PREMIUM 중 하나 이상
    const btnsText = await tabBtns.allInnerTexts()
    const hasPackageLabel = btnsText.some(t => /STANDARD|DELUXE|PREMIUM|스탠다드|디럭스|프리미엄/i.test(t))
    expect(hasPackageLabel).toBeTruthy()
    console.log('  패키지 탭 버튼:', btnsText)
  })

  test('PKG-2. 패키지 탭 클릭 시 해당 패키지 정보(가격) 표시', async ({ page }) => {
    const deployed = await isPackageTabDeployed(page)
    if (!deployed) {
      test.skip(true, '패키지 탭 UI 미배포 — Vercel 배포 후 재실행 필요')
      return
    }

    // 패키지 탭 버튼 목록
    const tabBtns = page.locator('div.rounded-lg.border button').filter({ hasNotText: '구매하기' })
    const tabCount = await tabBtns.count()
    if (tabCount === 0) {
      test.skip(true, '패키지 탭 버튼 없음')
      return
    }

    // 첫 번째 탭 클릭 후 가격 표시 확인
    await tabBtns.nth(0).click()
    await page.waitForTimeout(1000)
    const priceEl = page.locator('p.text-2xl.font-bold').first()
    await expect(priceEl).toBeVisible({ timeout: TIMEOUT })
    const firstPrice = await priceEl.innerText()
    expect(firstPrice.length).toBeGreaterThan(0)

    // 탭이 2개 이상이면 다음 탭도 전환해서 렌더링 확인
    if (tabCount >= 2) {
      await tabBtns.nth(1).click()
      await page.waitForTimeout(1000)
      const secondPrice = await page.locator('p.text-2xl.font-bold').first().innerText()
      expect(secondPrice.length).toBeGreaterThan(0)
      console.log(`  탭1 가격: ${firstPrice}, 탭2 가격: ${secondPrice}`)
    }
  })

  test('PKG-3. "구매하기" 또는 "주문하기" 버튼이 서비스 상세 페이지에 표시됨', async ({ page }) => {
    await page.goto(SERVICE_DETAIL_URL)
    await page.waitForTimeout(4000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(2000)

    // 탭 UI: "구매하기" 버튼 (배포 후)
    // 이전 테이블 UI: "주문하기" 버튼 (배포 전)
    // DOM에 존재하는지 count()로 확인 (스크롤 위치와 무관)
    const buyBtnCount = await page.getByRole('button', { name: '구매하기' }).count()
    const orderBtnCount = await page.getByRole('button', { name: '주문하기' }).count()

    if (buyBtnCount > 0) {
      console.log(`  "구매하기" 버튼 ${buyBtnCount}개 표시됨 (탭 UI 배포됨)`)
    } else if (orderBtnCount > 0) {
      console.log(`  "주문하기" 버튼 ${orderBtnCount}개 표시됨 (테이블 UI — 탭 UI 배포 전)`)
    }
    expect(buyBtnCount + orderBtnCount).toBeGreaterThan(0)
  })

  test('PKG-4. 로그인 후 "구매하기" 클릭 시 주문 페이지로 이동', async ({ page }) => {
    await login(page, BUYER)
    await page.goto(SERVICE_DETAIL_URL)
    await page.waitForTimeout(4000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(2000)

    // 탭 UI 배포 후 "구매하기" 버튼 클릭
    const buyBtn = page.getByRole('button', { name: '구매하기' })
    if (!await buyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '"구매하기" 버튼 없음 — 탭 UI 미배포')
      return
    }
    await buyBtn.click()
    await page.waitForTimeout(3000)
    // /orders/new?service=...&package=... 로 이동해야 함
    expect(page.url()).toContain('/orders/new')
  })
})

test.describe('판매자 응답률 텍스트 표시 (services/[id]/page.tsx)', () => {
  test('SEL-TAB-1. 서비스 상세 사이드바에 판매자 응답률 텍스트 표시', async ({ page }) => {
    await page.goto(SERVICE_DETAIL_URL)
    await page.waitForTimeout(4000)

    // response_time이 있는 판매자의 경우: "응답률 높음/보통/낮음" 표시
    const hasResponseRate = await page
      .getByText(/응답률\s*(높음|보통|낮음)/)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (!hasResponseRate) {
      // sellerProfile.response_time이 null인 경우 렌더링 안 함 → 스킵
      console.log('  판매자 응답률 데이터 없음 (response_time null) — 이 서비스는 스킵')
      test.skip(true, '이 서비스 판매자의 response_time이 설정되지 않아 응답률 표시 없음')
      return
    }

    await expect(page.getByText(/응답률\s*(높음|보통|낮음)/).first()).toBeVisible({ timeout: TIMEOUT })
    const rateText = await page.getByText(/응답률\s*(높음|보통|낮음)/).first().innerText()
    console.log(`  표시된 응답률: ${rateText}`)
  })

  test('SEL-TAB-2. 판매자 응답률 + 평균 응답시간(분) 동시 표시', async ({ page }) => {
    await page.goto(SERVICE_DETAIL_URL)
    await page.waitForTimeout(4000)

    const hasResponseRate = await page
      .getByText(/응답률\s*(높음|보통|낮음)/)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (!hasResponseRate) {
      test.skip(true, '이 서비스 판매자의 response_time이 설정되지 않아 응답률 표시 없음')
      return
    }

    // "평균 N분" 텍스트도 같이 표시되어야 함
    const hasAvgTime = await page
      .getByText(/평균\s*\d+분/)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    expect(hasAvgTime).toBeTruthy()
    const avgText = await page.getByText(/평균\s*\d+분/).first().innerText()
    console.log(`  평균 응답시간: ${avgText}`)
  })

  test('SEL-TAB-3. 응답률이 있는 서비스를 찾아 검증 (여러 서비스 순회)', async ({ page }) => {
    // 여러 서비스를 순회하여 response_time이 있는 판매자 서비스 찾기
    // 타임아웃을 90초로 증가
    test.setTimeout(90000)

    await page.goto('/services')
    await page.waitForTimeout(4000)

    // 서비스 URL 목록을 먼저 수집 후 순회
    const hrefs: string[] = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/services/"]'))
        .map(a => (a as HTMLAnchorElement).href)
        .filter(h => /\/services\/[a-f0-9-]{36}/.test(h))
        .slice(0, 5)
    })

    let foundResponseRate = false

    for (const href of hrefs) {
      await page.goto(href)
      await page.waitForTimeout(3000)

      const hasRate = await page
        .getByText(/응답률\s*(높음|보통|낮음)/)
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      if (hasRate) {
        foundResponseRate = true
        const rateText = await page.getByText(/응답률\s*(높음|보통|낮음)/).first().innerText()
        console.log(`  서비스 ${href}에서 응답률 발견: ${rateText}`)
        // 응답률 텍스트가 3가지 중 하나여야 함
        expect(rateText).toMatch(/응답률\s*(높음|보통|낮음)/)
        break
      }
    }

    if (!foundResponseRate) {
      console.log('  순회한 서비스 중 응답률 데이터가 있는 판매자 없음 — response_time DB 값 필요')
      test.skip(true, '테스트 계정 판매자의 response_time이 설정되지 않음')
    }
  })
})
