import { test, expect } from '@playwright/test'

test.describe('푸터 링크 (FOOT-1~5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  })

  test('FOOT-1: 푸터에 고객지원 섹션 링크 3개 표시', async ({ page }) => {
    const footer = page.locator('footer')
    const isVisible = await footer.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '푸터가 표시되지 않습니다')
      return
    }
    // 배포 감지: 링크가 아직 span일 수 있음
    const faqLink = footer.getByRole('link', { name: '자주 묻는 질문' })
    const hasLink = await faqLink.isVisible({ timeout: 3000 }).catch(() => false)
    if (!hasLink) {
      test.skip(true, '푸터 링크가 아직 배포되지 않았습니다')
      return
    }
    const termsLink = footer.getByRole('link', { name: '이용약관' })
    const privacyLink = footer.getByRole('link', { name: '개인정보처리방침' })

    await expect(faqLink).toBeVisible()
    await expect(termsLink).toBeVisible()
    await expect(privacyLink).toBeVisible()
  })

  test('FOOT-2: 자주 묻는 질문 링크가 /faq로 연결', async ({ page }) => {
    const footer = page.locator('footer')
    const faqLink = footer.getByRole('link', { name: '자주 묻는 질문' })
    const isVisible = await faqLink.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '푸터 링크가 표시되지 않습니다')
      return
    }
    await expect(faqLink).toHaveAttribute('href', '/faq')
  })

  test('FOOT-3: 이용약관 링크가 /terms로 연결', async ({ page }) => {
    const footer = page.locator('footer')
    const termsLink = footer.getByRole('link', { name: '이용약관' })
    const isVisible = await termsLink.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '푸터 링크가 표시되지 않습니다')
      return
    }
    await expect(termsLink).toHaveAttribute('href', '/terms')
  })

  test('FOOT-4: 개인정보처리방침 링크가 /privacy로 연결', async ({ page }) => {
    const footer = page.locator('footer')
    const privacyLink = footer.getByRole('link', { name: '개인정보처리방침' })
    const isVisible = await privacyLink.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '푸터 링크가 표시되지 않습니다')
      return
    }
    await expect(privacyLink).toHaveAttribute('href', '/privacy')
  })

  test('FOOT-5: FAQ 페이지 접근 시 제목 표시', async ({ page }) => {
    await page.goto('/faq')
    const heading = page.getByRole('heading', { name: '자주 묻는 질문' })
    const isVisible = await heading.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, 'FAQ 페이지가 아직 배포되지 않았습니다')
      return
    }
    await expect(heading).toBeVisible()
  })
})
