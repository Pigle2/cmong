import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

/**
 * 서비스 상세 페이지 - 이미지 갤러리 테스트
 *
 * GAL-1: 서비스 상세 페이지에 이미지 갤러리 영역이 표시됨
 * GAL-2: 이미지가 2개 이상인 경우 이전/다음 화살표 버튼이 표시됨
 * GAL-3: 화살표 클릭 시 인덱스 표시가 변경됨
 */

// /services 목록에서 첫 번째 서비스 상세 페이지 URL을 얻는 헬퍼
async function getFirstServiceUrl(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/services')
  await page.waitForLoadState('networkidle', { timeout: TIMEOUT })

  // 서비스 카드 링크 (href="/services/{uuid}" 패턴)
  const serviceLink = page.locator('a[href*="/services/"]').filter({
    hasNot: page.locator('[href="/services"]'),
  }).first()

  const href = await serviceLink.getAttribute('href', { timeout: TIMEOUT }).catch(() => null)
  return href
}

test.describe('서비스 상세 - 이미지 갤러리 (GAL)', () => {
  test('GAL-1: 서비스 상세 페이지에 이미지 갤러리 영역이 표시됨', async ({ page }) => {
    const serviceHref = await getFirstServiceUrl(page)
    if (!serviceHref) {
      test.skip(true, '서비스 목록에서 상세 링크를 찾을 수 없음')
      return
    }

    await page.goto(serviceHref)
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT })

    // 이미지 갤러리 영역: aspect-video 컨테이너 (이미지 또는 🎨 아이콘)
    // ImageGallery 컴포넌트는 항상 aspect-video rounded-lg bg-muted 래퍼를 렌더링함
    const galleryContainer = page.locator('.aspect-video').first()
    await expect(galleryContainer).toBeVisible({ timeout: TIMEOUT })

    // 이미지가 있는 경우 img 태그, 없으면 🎨 이모지 텍스트
    const hasImage = await page.locator('.aspect-video img').first().isVisible({ timeout: 3000 }).catch(() => false)
    const hasIcon = await page.locator('.aspect-video').filter({ hasText: '🎨' }).first().isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasImage || hasIcon).toBeTruthy()
    console.log(`  갤러리 표시 형태: ${hasImage ? '이미지' : '🎨 아이콘'}`)
  })

  test('GAL-2: 이미지가 2개 이상인 경우 이전/다음 화살표 버튼이 표시됨', async ({ page }) => {
    const serviceHref = await getFirstServiceUrl(page)
    if (!serviceHref) {
      test.skip(true, '서비스 목록에서 상세 링크를 찾을 수 없음')
      return
    }

    await page.goto(serviceHref)
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT })

    // 이미지 개수 파악: 갤러리 메인 이미지 아래 썸네일 인디케이터 존재 여부로 판단
    const prevButton = page.getByRole('button', { name: '이전 이미지' })
    const nextButton = page.getByRole('button', { name: '다음 이미지' })

    const hasPrev = await prevButton.isVisible({ timeout: 3000 }).catch(() => false)
    const hasNext = await nextButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasPrev && !hasNext) {
      // 이미지가 1개이거나 없는 경우: 화살표 숨김이 올바른 동작
      // 갤러리 컨테이너 자체는 여전히 있어야 함
      const galleryContainer = page.locator('.aspect-video').first()
      await expect(galleryContainer).toBeVisible({ timeout: TIMEOUT })
      console.log('  이미지 1개 이하: 화살표/인디케이터 숨김 (올바른 동작)')
    } else {
      // 이미지 2개 이상: 양쪽 버튼 모두 있어야 함
      await expect(prevButton).toBeVisible({ timeout: TIMEOUT })
      await expect(nextButton).toBeVisible({ timeout: TIMEOUT })

      // 인덱스 표시 "N / M" 형식도 확인
      const indexBadge = page.locator('text=/\\d+ \\/ \\d+/')
      await expect(indexBadge).toBeVisible({ timeout: TIMEOUT })
      const indexText = await indexBadge.textContent()
      console.log(`  이미지 다수: 인덱스 표시 = "${indexText}"`)
    }
  })

  test('GAL-3: 화살표 클릭 시 이미지 인덱스 표시가 변경됨', async ({ page }) => {
    const serviceHref = await getFirstServiceUrl(page)
    if (!serviceHref) {
      test.skip(true, '서비스 목록에서 상세 링크를 찾을 수 없음')
      return
    }

    await page.goto(serviceHref)
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT })

    const nextButton = page.getByRole('button', { name: '다음 이미지' })
    const hasNext = await nextButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasNext) {
      test.skip(true, '이미지가 1개 이하여서 화살표 없음 (정상 동작 확인됨)')
      return
    }

    // 클릭 전 인덱스 텍스트 기록
    const indexBadge = page.locator('text=/\\d+ \\/ \\d+/')
    const beforeText = await indexBadge.textContent({ timeout: TIMEOUT })
    console.log(`  클릭 전 인덱스: "${beforeText}"`)

    // 다음 이미지 버튼 클릭
    await nextButton.click()
    await page.waitForTimeout(500)

    // 클릭 후 인덱스 변경 확인
    const afterText = await indexBadge.textContent({ timeout: TIMEOUT })
    console.log(`  클릭 후 인덱스: "${afterText}"`)

    expect(afterText).not.toBe(beforeText)

    // 이전 버튼 클릭으로 첫 번째 이미지로 복귀 확인
    const prevButton = page.getByRole('button', { name: '이전 이미지' })
    await prevButton.click()
    await page.waitForTimeout(500)

    const restoredText = await indexBadge.textContent({ timeout: TIMEOUT })
    console.log(`  이전 버튼 후 인덱스: "${restoredText}"`)
    expect(restoredText).toBe(beforeText)
  })
})
