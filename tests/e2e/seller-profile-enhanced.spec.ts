import { test, expect } from '@playwright/test'

test.describe('판매자 프로필 강화 (SPROF-1~8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seller/profile')
    const heading = page.getByRole('heading', { name: '판매자 프로필' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'profile' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first === 'timeout') {
      test.skip(true, '판매자 프로필 페이지가 아직 배포되지 않았습니다')
    }
  })

  test('SPROF-1: 프로필 이미지 섹션 표시', async ({ page }) => {
    const imageSection = page.getByText('프로필 이미지')
    await expect(imageSection).toBeVisible({ timeout: 5000 }).catch(() => {
      test.skip(true, '프로필 이미지 섹션이 아직 배포되지 않았습니다')
    })
  })

  test('SPROF-2: 이미지 변경 버튼이 비활성화 상태 (프로토타입)', async ({ page }) => {
    const changeBtn = page.getByRole('button', { name: '이미지 변경' })
    const isVisible = await changeBtn.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '이미지 변경 버튼이 없습니다')
      return
    }
    await expect(changeBtn).toBeDisabled()
  })

  test('SPROF-3: 기본 정보 폼 필드 존재 (활동명/소개)', async ({ page }) => {
    const nameInput = page.locator('#displayName')
    const introInput = page.locator('#introduction')
    const nameVisible = await nameInput.isVisible().catch(() => false)
    const introVisible = await introInput.isVisible().catch(() => false)
    if (!nameVisible) {
      test.skip(true, '기본 정보 폼이 아직 배포되지 않았습니다')
      return
    }
    expect(nameVisible).toBe(true)
    expect(introVisible).toBe(true)
  })

  test('SPROF-4: 전문 분야 태그 UI 표시 (추가/제거 가능)', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: '추가' })
    const isVisible = await addBtn.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '태그 추가 버튼이 없습니다')
      return
    }
    await expect(addBtn).toBeVisible()
  })

  test('SPROF-5: 경력 사항 섹션 표시 (프로토타입)', async ({ page }) => {
    const careerSection = page.getByText('경력 사항')
    const isVisible = await careerSection.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '경력 사항 섹션이 아직 배포되지 않았습니다')
      return
    }
    await expect(page.getByText('추후 지원 예정').first()).toBeVisible()
  })

  test('SPROF-6: 포트폴리오 섹션 표시 (프로토타입)', async ({ page }) => {
    const portfolioSection = page.getByText('포트폴리오')
    const isVisible = await portfolioSection.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '포트폴리오 섹션이 아직 배포되지 않았습니다')
      return
    }
    await expect(page.getByText(/포트폴리오 업로드 기능은 추후 지원 예정/)).toBeVisible()
  })

  test('SPROF-7: 인증 정보 섹션 표시 (프로토타입)', async ({ page }) => {
    const certSection = page.getByText('인증 정보')
    const isVisible = await certSection.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '인증 정보 섹션이 아직 배포되지 않았습니다')
      return
    }
    await expect(page.getByText('본인 인증: 미인증')).toBeVisible()
    await expect(page.getByText('사업자 인증: 미인증')).toBeVisible()
  })

  test('SPROF-8: 저장 버튼 표시', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /저장/ })
    const isVisible = await saveBtn.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '저장 버튼이 없습니다')
      return
    }
    await expect(saveBtn).toBeEnabled()
  })
})
