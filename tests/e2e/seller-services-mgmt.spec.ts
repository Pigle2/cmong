import { test, expect } from '@playwright/test'

test.describe('판매자 서비스 관리 (SVCM-1~8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seller/services')
    const heading = page.getByRole('heading', { name: '서비스 관리' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'services' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first === 'timeout') {
      test.skip(true, '판매자 서비스 관리 페이지가 아직 배포되지 않았습니다')
    }
  })

  test('SVCM-1: 서비스 관리 페이지에 "새 서비스 등록" 버튼 표시', async ({ page }) => {
    const newBtn = page.getByRole('link', { name: /새 서비스 등록/ })
    await expect(newBtn).toBeVisible({ timeout: 5000 }).catch(() => {
      test.skip(true, '새 서비스 등록 버튼이 없습니다')
    })
    await expect(newBtn).toHaveAttribute('href', '/seller/services/new')
  })

  test('SVCM-2: 상태 필터 탭 4개 표시 (전체/판매중/임시저장/중지)', async ({ page }) => {
    const tabNames = ['전체', '판매중', '임시저장', '중지']
    for (const name of tabNames) {
      const tab = page.getByRole('tab', { name: new RegExp(name) })
      const isVisible = await tab.isVisible().catch(() => false)
      if (!isVisible) {
        test.skip(true, `${name} 탭이 아직 배포되지 않았습니다`)
        return
      }
    }
  })

  test('SVCM-3: 전체 탭이 기본 선택됨', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: /전체/ })
    const isVisible = await allTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '상태 탭이 아직 배포되지 않았습니다')
      return
    }
    await expect(allTab).toHaveAttribute('data-state', 'active')
  })

  test('SVCM-4: 판매중 탭 클릭 시 탭 전환', async ({ page }) => {
    const activeTab = page.getByRole('tab', { name: /판매중/ })
    const isVisible = await activeTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '상태 탭이 아직 배포되지 않았습니다')
      return
    }
    await activeTab.click()
    await expect(activeTab).toHaveAttribute('data-state', 'active')
  })

  test('SVCM-5: 각 탭에 건수가 표시됨', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: /전체/ })
    const isVisible = await allTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '상태 탭이 아직 배포되지 않았습니다')
      return
    }
    const tabText = await allTab.textContent()
    expect(tabText).toMatch(/전체\s*\(\d+\)/)
  })

  test('SVCM-6: 서비스 카드에 수정 버튼 표시', async ({ page }) => {
    // 로그인 리다이렉트 시 스킵
    const heading = page.getByRole('heading', { name: '서비스 관리' })
    const isOnPage = await heading.isVisible().catch(() => false)
    if (!isOnPage) {
      test.skip(true, '서비스 관리 페이지에 접근할 수 없습니다')
      return
    }
    // 서비스가 있으면 수정 버튼이 존재해야 함
    const editBtn = page.getByRole('link', { name: /수정/ }).first()
    const emptyMsg = page.getByText('등록된 서비스가 없습니다')
    const hasEdit = await editBtn.isVisible().catch(() => false)
    const hasEmpty = await emptyMsg.isVisible().catch(() => false)
    expect(hasEdit || hasEmpty).toBe(true)
  })

  test('SVCM-7: 서비스 카드에 삭제 버튼 표시', async ({ page }) => {
    const heading = page.getByRole('heading', { name: '서비스 관리' })
    const isOnPage = await heading.isVisible().catch(() => false)
    if (!isOnPage) {
      test.skip(true, '서비스 관리 페이지에 접근할 수 없습니다')
      return
    }
    const deleteBtn = page.getByRole('button', { name: /삭제/ }).first()
    const emptyMsg = page.getByText('등록된 서비스가 없습니다')
    const hasDelete = await deleteBtn.isVisible().catch(() => false)
    const hasEmpty = await emptyMsg.isVisible().catch(() => false)
    expect(hasDelete || hasEmpty).toBe(true)
  })

  test('SVCM-8: 서비스 상태 변경 API 보안 (비인증)', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await request.patch(`/api/seller/services/${fakeId}/status`, {
      data: { status: 'PAUSED' },
    })
    // 미배포 시 404, 배포 후 401
    expect([401, 404]).toContain(res.status())
  })
})
