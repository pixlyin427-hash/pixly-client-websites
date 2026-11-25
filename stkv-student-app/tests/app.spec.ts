import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { ROUTES, open, signedIn, watchErrors } from './helpers'

test.describe('every screen', () => {
  test('opens without errors or horizontal overflow', async ({ page }) => {
    const errors = watchErrors(page)
    await signedIn(page)
    for (const r of ROUTES) {
      await open(page, r)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `overflow on ${r}`).toBeLessThanOrEqual(0)
    }
    expect(errors).toEqual([])
  })

  test('opens in Marathi with reduced motion, without overflow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 400, 'phone only')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors = watchErrors(page)
    await signedIn(page, { lang: 'mr', motion: 'system' })
    for (const r of ROUTES) {
      await open(page, r)
      await expect(page.locator('html')).toHaveAttribute('lang', 'mr')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `overflow on ${r}`).toBeLessThanOrEqual(0)
    }
    expect(errors).toEqual([])
  })
})

test.describe('navigation', () => {
  for (const lang of ['en', 'hi', 'mr']) {
    test(`tab labels are never cut off (${lang})`, async ({ page }) => {
      await signedIn(page, { lang })
      await open(page, '/school')
      const nav = page.getByRole('navigation').filter({ visible: true }).first()
      await expect(nav.getByRole('button')).toHaveCount(5)
      const cut = await nav.evaluate((n) => [...n.querySelectorAll('button span:last-child')].filter((s) => s.scrollWidth > s.clientWidth).map((s) => s.textContent))
      expect(cut).toEqual([])
      await nav.getByRole('button').nth(3).click()
      await expect(page).toHaveURL(/#\/achievements$/)
      await expect(nav.getByRole('button').nth(3)).toHaveAttribute('aria-current', 'page')
    })
  }
})

test.describe('phone flows', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) > 400, 'phone only')

  test('sign in validation, demo sign in and onboarding', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Get started' }).click()
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Enter your Student ID')).toBeVisible()
    await page.getByRole('button', { name: 'Use the demo account' }).click()
    await expect(page.getByText('Step 1 of 4')).toBeVisible()
    await page.getByLabel('Full name').fill('A')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Enter your name (at least 2 letters).')).toBeVisible()
    await page.getByLabel('Full name').fill('Riya Patil')
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Finish setup' }).click()
    await expect(page.getByText('You’re all set, Riya')).toBeVisible()
    await expect(page.getByText('Riya Patil').first()).toBeVisible({ timeout: 5000 })
    await page.reload()
    await expect(page.getByText('Riya Patil').first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('tonight task, pack list and badge persist after reload', async ({ page }) => {
    await signedIn(page)
    await open(page, '/')
    await page.getByRole('checkbox', { name: 'Exercise 4.2, questions 1–8' }).click()
    await expect(page.getByRole('checkbox', { name: 'Exercise 4.2, questions 1–8' })).toHaveAttribute('aria-checked', 'true')
    for (const item of ['House T-shirt', 'Hindi textbook', 'Sketchbook & pastels', 'Signed test paper']) await page.getByRole('button', { name: item }).click()
    await expect(page.getByRole('dialog', { name: 'Badge unlocked!' })).toBeVisible()
    await page.getByRole('button', { name: 'Awesome' }).click()
    await page.reload()
    await expect(page.getByRole('checkbox', { name: 'Exercise 4.2, questions 1–8' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('Bag ready')).toBeVisible()
    await open(page, '/achievements')
    await page.getByRole('button', { name: /Ready the night before/ }).click()
    await expect(page.getByText(/^Earned/)).toBeVisible()
  })

  test('homework submit flow', async ({ page }) => {
    await signedIn(page)
    await open(page, '/homework/hw-mar')
    await page.getByRole('button', { name: 'Submit to teacher' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByText('Submitted', { exact: false }).first()).toBeVisible({ timeout: 4000 })
    await page.reload()
    await expect(page.getByRole('button', { name: 'Submit to teacher' })).toHaveCount(0)
  })

  test('service request validation, submit and status', async ({ page }) => {
    await signedIn(page)
    await open(page, '/requests/new')
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByText('Add a reason (at least 5 characters).')).toBeVisible()
    await page.getByLabel('Reason or details').fill('Family function in Pune')
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page).toHaveURL(/#\/requests$/, { timeout: 5000 })
    await expect(page.getByText('Leave application')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Leave application')).toBeVisible()
  })

  test('online quiz can be taken and scored', async ({ page }) => {
    await signedIn(page)
    await open(page, '/exams/quiz')
    await page.getByRole('button', { name: 'Begin' }).click()
    for (let i = 0; i < 6; i++) {
      await page.getByRole('radio').first().click()
      if (i < 5) await page.getByRole('button', { name: 'Next', exact: true }).click()
    }
    await page.getByRole('button', { name: 'Submit quiz' }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByRole('heading', { name: 'Your score' })).toBeVisible()
    await page.getByRole('button', { name: 'Review answers' }).click()
    await expect(page.getByText('Your answer').first()).toBeVisible()
  })

  test('daily recall completes and counts a day', async ({ page }) => {
    await signedIn(page)
    await open(page, '/study/recall')
    for (let i = 0; i < 5; i++) {
      await page.getByRole('radio').first().click()
      await page.getByRole('button', { name: i < 4 ? 'Next' : 'Finish', exact: true }).click()
    }
    await expect(page.getByText(/-day streak/)).toContainText('8-day streak')
  })

  test('fee payment shows a receipt and persists', async ({ page }) => {
    await signedIn(page)
    await open(page, '/fees')
    await page.getByRole('button', { name: 'Pay', exact: true }).first().click()
    await page.getByRole('button', { name: /Pay .* \(demo\)/ }).click()
    await expect(page.getByRole('dialog', { name: 'Receipt' })).toBeVisible({ timeout: 5000 })
    await page.reload()
    await expect(page.getByRole('button', { name: 'Pay', exact: true })).toHaveCount(1)
  })

  test('chat sends a message and receives a reply', async ({ page }) => {
    await signedIn(page)
    await open(page, '/messages/chat/ch-joshi')
    await page.getByLabel('Type a message').fill('Thank you, ma’am')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByText('Thank you, ma’am')).toBeVisible()
    await expect(page.getByText('I will check and reply in class tomorrow.')).toBeVisible({ timeout: 5000 })
  })

  test('language, theme, text size and app lock persist', async ({ page }) => {
    await signedIn(page)
    await open(page, '/settings')
    await page.getByRole('button', { name: /^Language/ }).first().click()
    await page.getByRole('radio', { name: 'हिंदी' }).click()
    await expect(page.getByRole('navigation', { name: 'मुख्य नेविगेशन' }).first()).toBeVisible()
    await page.getByRole('tab', { name: 'डार्क' }).click()
    await page.getByRole('tab', { name: 'बड़ा' }).click()
    await page.getByRole('switch', { name: /ऐप लॉक/ }).click()
    await page.reload()
    await expect(page.getByText('पिन डालें')).toBeVisible()
    for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-text', 'lg')
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi')
  })

  test('home sections can be hidden and marks hidden', async ({ page }) => {
    await signedIn(page)
    await open(page, '/settings')
    await page.getByRole('switch', { name: 'Birthdays & family' }).click()
    await page.getByRole('switch', { name: 'Hide marks on Home' }).click()
    await open(page, '/')
    await expect(page.getByRole('heading', { name: 'Birthdays' })).toHaveCount(0)
    await expect(page.getByText('Marks hidden')).toBeVisible()
  })

  test('notification opens its content and is marked read', async ({ page }) => {
    await signedIn(page)
    await open(page, '/notifications')
    await page.getByRole('button', { name: /Due tomorrow/ }).click()
    await expect(page).toHaveURL(/#\/homework\/hw-mat/)
    await page.goBack()
    await expect(page.getByText('5 unread')).toBeVisible()
  })

  test('search finds homework and notices', async ({ page }) => {
    await signedIn(page)
    await open(page, '/search')
    await page.getByRole('textbox', { name: 'Search' }).fill('trip')
    await expect(page.getByRole('button', { name: /Science centre trip/ })).toBeVisible()
    await page.getByRole('textbox', { name: 'Search' }).fill('zzzz')
    await expect(page.getByText('No results for “zzzz”')).toBeVisible()
  })
})

test.describe('accessibility', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) > 400, 'phone only')
  for (const theme of ['light', 'dark'] as const) {
    test(`axe: key screens in ${theme} mode`, async ({ page }) => {
      await signedIn(page, { theme })
      const report: string[] = []
      for (const r of ['/', '/homework/hw-mat', '/attendance', '/settings', '/achievements', '/fees']) {
        await open(page, r)
        await page.waitForTimeout(900) // let entrance fades finish so contrast is measured on settled colours
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
        for (const v of res.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) report.push(`${r} ${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`)
      }
      expect(report).toEqual([])
    })
  }
})
