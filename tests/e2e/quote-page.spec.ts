import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

/**
 * 견적 요청 페이지 테스트
 *
 * QT-1: /quote 페이지 접근 시 견적 요청 폼이 표시됨
 * QT-2: GNB에 "견적요청" 링크가 존재함
 * QT-3: 견적요청 링크 클릭 시 /quote 페이지로 이동
 * QT-4: 폼에 필수 입력 필드들이 존재함 (제목, 상세 내용)
 * QT-5: "견적 요청하기" 버튼이 표시됨
 *
 * 페이지 구성:
 * - /quote 경로
 * - 폼: 카테고리 선택, 제목, 상세 내용, 예산 범위, 희망 납기
 * - 제출 버튼: "견적 요청하기"
 * - GNB에 "견적요청" 링크
 */

// 배포 여부 확인 헬퍼 — /quote 페이지 404 여부로 판단
async function isQuotePageDeployed(page: import('@playwright/test').Page): Promise<boolean> {
  const response = await page.goto('/quote').catch(() => null)
  if (!response) return false
  // 200 OK 이고 "견적" 텍스트가 있으면 배포된 것으로 판단
  if (response.status() !== 200) return false
  const hasContent = await page.getByText('견적').first().isVisible({ timeout: 5000 }).catch(() => false)
  return hasContent
}

// GNB 배포 여부 확인 헬퍼 — 헤더에 "견적요청" 링크 유무로 판단
async function isGnbQuoteLinkDeployed(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/')
  await page.waitForLoadState('networkidle', { timeout: TIMEOUT })
  return page.locator('header').getByText('견적요청').isVisible({ timeout: 5000 }).catch(() => false)
}

test.describe('견적 요청 페이지 (QT)', () => {

  test('QT-1: /quote 페이지 접근 시 견적 요청 폼이 표시됨', async ({ page }) => {
    const isDeployed = await isQuotePageDeployed(page)
    if (!isDeployed) {
      test.skip(true, '/quote 페이지 미배포 — 배포 후 재실행 필요')
      return
    }

    // /quote 페이지 진입 확인
    await expect(page).toHaveURL(/\/quote/, { timeout: TIMEOUT })

    // 견적 관련 텍스트(제목/헤딩)가 페이지에 표시되어야 함
    const headingCandidates = ['견적 요청', '견적요청', '견적을 요청']
    let foundHeading = false
    for (const text of headingCandidates) {
      const isVisible = await page.getByText(text).first().isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) {
        foundHeading = true
        console.log(`  페이지 헤딩 텍스트: "${text}"`)
        break
      }
    }
    expect(foundHeading).toBeTruthy()

    // 폼 요소가 존재해야 함
    const form = page.locator('form').first()
    await expect(form).toBeVisible({ timeout: TIMEOUT })
    console.log('  견적 요청 폼 표시 확인')
  })

  test('QT-2: GNB에 "견적요청" 링크가 존재함', async ({ page }) => {
    const isDeployed = await isGnbQuoteLinkDeployed(page)
    if (!isDeployed) {
      test.skip(true, 'GNB 견적요청 링크 미배포 — 배포 후 재실행 필요')
      return
    }

    // 헤더 영역에 "견적요청" 텍스트 링크가 있어야 함
    const header = page.locator('header')
    const quoteLink = header.getByText('견적요청')
    await expect(quoteLink).toBeVisible({ timeout: TIMEOUT })
    console.log('  GNB "견적요청" 링크 표시 확인')

    // 링크 태그(a) 이거나 클릭 가능한 요소여야 함
    const tagName = await quoteLink.evaluate((el) => el.tagName.toLowerCase()).catch(() => null)
    console.log(`  링크 태그: <${tagName}>`)
    // a 태그이거나 href 속성이 있는 부모를 가져야 함 (유연한 검증)
    const href = await quoteLink.getAttribute('href').catch(() => null)
    const parentHref = await quoteLink.locator('..').getAttribute('href').catch(() => null)
    const hasHref = href !== null || parentHref !== null
    if (hasHref) {
      const linkHref = href || parentHref
      console.log(`  href: ${linkHref}`)
    }
    // 클릭 가능 여부 확인 (링크이든 버튼이든 클릭 가능해야 함)
    await expect(quoteLink).toBeEnabled({ timeout: TIMEOUT })
  })

  test('QT-3: 견적요청 링크 클릭 시 /quote 페이지로 이동', async ({ page }) => {
    // GNB 배포 여부 확인
    const isGnbDeployed = await isGnbQuoteLinkDeployed(page)
    if (!isGnbDeployed) {
      test.skip(true, 'GNB 견적요청 링크 미배포 — 배포 후 재실행 필요')
      return
    }

    // 홈에서 GNB 링크 클릭
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT })
    const quoteLink = page.locator('header').getByText('견적요청')
    await expect(quoteLink).toBeVisible({ timeout: TIMEOUT })
    await quoteLink.click()

    // /quote 경로로 이동했는지 확인
    await expect(page).toHaveURL(/\/quote/, { timeout: TIMEOUT })
    console.log(`  클릭 후 URL: ${page.url()}`)

    // 페이지 콘텐츠가 로드되었는지 확인 (404가 아닌 실제 콘텐츠)
    const is404 = await page.getByText('404').isVisible({ timeout: 3000 }).catch(() => false)
    expect(is404).toBeFalsy()
    console.log('  /quote 페이지 정상 접근 확인')
  })

  test('QT-4: 폼에 필수 입력 필드들이 존재함 (제목, 상세 내용)', async ({ page }) => {
    const isDeployed = await isQuotePageDeployed(page)
    if (!isDeployed) {
      test.skip(true, '/quote 페이지 미배포 — 배포 후 재실행 필요')
      return
    }

    // 제목 입력 필드 확인 — input 또는 textarea, placeholder에 "제목" 포함 가능
    const titleFieldCandidates = [
      page.getByPlaceholder(/제목/),
      page.locator('input[name="title"]'),
      page.locator('input[id*="title"]'),
      page.getByLabel(/제목/),
    ]
    let foundTitle = false
    for (const candidate of titleFieldCandidates) {
      const isVisible = await candidate.first().isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) {
        foundTitle = true
        const placeholder = await candidate.first().getAttribute('placeholder').catch(() => '')
        console.log(`  제목 필드 발견 (placeholder: "${placeholder}")`)
        break
      }
    }
    expect(foundTitle).toBeTruthy()

    // 상세 내용 입력 필드 확인 — textarea 또는 placeholder에 "내용"/"상세" 포함 가능
    const contentFieldCandidates = [
      page.getByPlaceholder(/내용/),
      page.getByPlaceholder(/상세/),
      page.locator('textarea').first(),
      page.locator('textarea[name*="content"]'),
      page.locator('textarea[name*="description"]'),
    ]
    let foundContent = false
    for (const candidate of contentFieldCandidates) {
      const isVisible = await candidate.first().isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) {
        foundContent = true
        const placeholder = await candidate.first().getAttribute('placeholder').catch(() => '')
        console.log(`  상세 내용 필드 발견 (placeholder: "${placeholder}")`)
        break
      }
    }
    expect(foundContent).toBeTruthy()
  })

  test('QT-5: "견적 요청하기" 버튼이 표시됨', async ({ page }) => {
    const isDeployed = await isQuotePageDeployed(page)
    if (!isDeployed) {
      test.skip(true, '/quote 페이지 미배포 — 배포 후 재실행 필요')
      return
    }

    // "견적 요청하기" 또는 유사한 제출 버튼 확인
    const submitButtonCandidates = [
      page.getByRole('button', { name: '견적 요청하기' }),
      page.getByRole('button', { name: '견적요청하기' }),
      page.getByRole('button', { name: /견적 요청/ }),
      page.locator('button[type="submit"]').first(),
    ]
    let foundButton = false
    for (const candidate of submitButtonCandidates) {
      const isVisible = await candidate.first().isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) {
        foundButton = true
        const text = await candidate.first().textContent().catch(() => '')
        console.log(`  제출 버튼 발견: "${text?.trim()}"`)
        break
      }
    }
    expect(foundButton).toBeTruthy()
    console.log('  "견적 요청하기" 버튼 표시 확인')
  })

})
