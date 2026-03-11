import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

// ── 메인 페이지 검색 기능 ──
// ServiceSearchBar 컴포넌트가 Hero 섹션에 탑재된 이후 추가된 테스트

test.describe('검색 - 메인 페이지 SearchBar', () => {
  test('SRCH-1. 메인 페이지에 검색 입력 필드가 존재한다', async ({ page }) => {
    await page.goto('/')
    // Hero 섹션의 ServiceSearchBar — placeholder "어떤 서비스가 필요하세요?"
    const searchInput = page.locator('input[placeholder="어떤 서비스가 필요하세요?"]')
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    // 검색 버튼도 함께 렌더링되어야 한다
    const searchBtn = page.locator('form').filter({ has: searchInput }).getByRole('button', { name: '검색' })
    await expect(searchBtn).toBeVisible({ timeout: TIMEOUT })
  })

  test('SRCH-2. 메인 페이지 검색어 입력 후 Enter → /services?q=검색어로 이동', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[placeholder="어떤 서비스가 필요하세요?"]')
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    await searchInput.fill('로고 디자인')
    await searchInput.press('Enter')
    // Next.js router.push 이후 URL 변경 대기
    await page.waitForURL(/\/services/, { timeout: TIMEOUT })
    expect(page.url()).toContain('q=%EB%A1%9C%EA%B3%A0+%EB%94%94%EC%9E%90%EC%9D%B8')
    // 검색 결과 페이지 핵심 요소 확인
    await expect(page.getByText(/총.*\d+.*개의 서비스/)).toBeVisible({ timeout: TIMEOUT })
  })

  test('SRCH-3. 메인 페이지 검색 버튼 클릭 → /services?q=검색어로 이동', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[placeholder="어떤 서비스가 필요하세요?"]')
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    await searchInput.fill('개발')
    // Enter 대신 검색 버튼 클릭
    const searchBtn = page.locator('form').filter({ has: searchInput }).getByRole('button', { name: '검색' })
    await searchBtn.click()
    await page.waitForURL(/\/services/, { timeout: TIMEOUT })
    expect(page.url()).toContain('q=')
    expect(page.url()).toContain('%EA%B0%9C%EB%B0%9C') // "개발" URL 인코딩
    await expect(page.getByText(/총.*\d+.*개의 서비스/)).toBeVisible({ timeout: TIMEOUT })
  })

  test('SRCH-4. 메인 페이지 빈 검색어로 제출 → /services로 이동 (q 파라미터 없이)', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[placeholder="어떤 서비스가 필요하세요?"]')
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    // 아무것도 입력하지 않고 검색 버튼 클릭
    const searchBtn = page.locator('form').filter({ has: searchInput }).getByRole('button', { name: '검색' })
    await searchBtn.click()
    await page.waitForURL(/\/services/, { timeout: TIMEOUT })
    // 빈 query는 params.set('q', ...) 호출 없이 /services?로 이동 → q= 없어야 함
    expect(page.url()).not.toContain('q=')
    await expect(page.getByText(/총.*\d+.*개의 서비스/)).toBeVisible({ timeout: TIMEOUT })
  })

  test('SRCH-5. /services 페이지의 검색바에서도 키워드 검색 동작', async ({ page }) => {
    await page.goto('/services')
    // /services 페이지 상단의 ServiceSearchBar — placeholder "어떤 서비스를 찾으시나요?"
    const searchInput = page.locator('input[placeholder="어떤 서비스를 찾으시나요?"]')
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    await searchInput.fill('마케팅')
    await searchInput.press('Enter')
    await page.waitForURL(/q=/, { timeout: TIMEOUT })
    expect(page.url()).toContain('q=')
    await expect(page.getByText(/총.*\d+.*개의 서비스/)).toBeVisible({ timeout: TIMEOUT })
  })

  test('SRCH-6. /services?q=기존검색어 접근 시 검색바에 기존 검색어가 채워진다', async ({ page }) => {
    // defaultValue prop 동작 확인: ServicesPage가 rawQ를 ServiceSearchBar에 전달
    await page.goto('/services?q=로고')
    const searchInput = page.locator('input[placeholder="어떤 서비스를 찾으시나요?"]')
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    const value = await searchInput.inputValue()
    expect(value).toBe('로고')
  })

  test('SRCH-7. 메인 페이지 검색 후 다시 검색어 변경 → URL 업데이트', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[placeholder="어떤 서비스가 필요하세요?"]')
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })

    // 첫 번째 검색
    await searchInput.fill('디자인')
    await searchInput.press('Enter')
    await page.waitForURL(/q=/, { timeout: TIMEOUT })
    expect(page.url()).toContain('q=')

    // /services 페이지에서 검색바로 두 번째 검색
    const servicesInput = page.locator('input[placeholder="어떤 서비스를 찾으시나요?"]')
    await expect(servicesInput).toBeVisible({ timeout: TIMEOUT })
    await servicesInput.fill('영상')
    await servicesInput.press('Enter')
    // "영상" 인코딩(%EC%98%81%EC%83%81)이 URL에 포함될 때까지 대기
    await page.waitForURL(/EC%98%81/, { timeout: TIMEOUT })
    expect(page.url()).toContain('%EC%98%81%EC%83%81') // "영상" URL 인코딩
  })
})
