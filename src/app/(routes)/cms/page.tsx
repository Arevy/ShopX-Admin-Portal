'use client'

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { RichTextEditor } from '@/components/RichTextEditor'
import { useCms } from '@/hooks/useCms'
import { useTranslation } from '@/i18n'
import type { CmsPage, CmsStatus } from '@/types/domain'
import styles from './CmsPage.module.scss'

const TRANSLATION_NAMESPACE = 'Page_Admin_Cms'

const defaultForm = () => ({
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  body: '',
  status: 'DRAFT' as CmsStatus,
  publishedAt: '',
})

const statusLabel = (status: CmsStatus, translate: (key: string) => string) =>
  translate(`statuses.${status.toLowerCase()}`)

const CmsPageRoute = observer(() => {
  const cmsStore = useCms()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)
  const [form, setForm] = useState(defaultForm())
  const [isDirty, setIsDirty] = useState(false)
  const [statusFilter, setStatusFilter] = useState<CmsStatus | ''>(
    cmsStore.filters.status ?? '',
  )
  const [slugFilter, setSlugFilter] = useState(cmsStore.filters.slug ?? '')

  const sortedPages = useMemo(
    () =>
      cmsStore.pages
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [cmsStore.pages],
  )

  const populateForm = useCallback(
    (page: CmsPage | null) => {
      if (page) {
        setForm({
          id: page.id,
          slug: page.slug,
          title: page.title,
          excerpt: page.excerpt ?? '',
          body: page.body,
          status: page.status,
          publishedAt: page.publishedAt ?? '',
        })
      } else {
        setForm(defaultForm())
      }
      setIsDirty(false)
    },
    [],
  )

  useEffect(() => {
    populateForm(cmsStore.selectedPage)
  }, [cmsStore.selectedPage, populateForm])

  useEffect(() => {
    setStatusFilter(cmsStore.filters.status ?? '')
    setSlugFilter(cmsStore.filters.slug ?? '')
  }, [cmsStore.filters.status, cmsStore.filters.slug])

  const resetForm = useCallback(() => {
    cmsStore.selectPage(null)
    populateForm(null)
  }, [cmsStore, populateForm])

  const handleSelect = useCallback(
    (page: CmsPage) => {
      cmsStore.selectPage(page)
    },
    [cmsStore],
  )

  const handleChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
    if (cmsStore.error) {
      cmsStore.error = null
    }
  }

  const handleSave = async () => {
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      body: form.body,
      status: form.status,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    }

    if (!payload.slug || !payload.title || !payload.body) {
      cmsStore.error = t('form.errors.required_fields')
      return
    }

    if (form.id) {
      await cmsStore.updatePage(form.id, payload)
      setIsDirty(false)
    } else {
      const created = await cmsStore.createPage(payload)
      if (created) {
        handleSelect(created)
      }
    }
  }

  const handlePublish = async () => {
    if (!form.id) return
    await cmsStore.publishPage(form.id)
  }

  const handleDiscard = () => {
    populateForm(cmsStore.selectedPage)
    if (cmsStore.error) {
      cmsStore.error = null
    }
  }

  const handleDelete = async () => {
    if (!form.id) return
    const confirmation = window.confirm(t('form.confirm_delete'))
    if (!confirmation) return
    await cmsStore.deletePage(form.id)
    resetForm()
  }

  const handleFilterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await cmsStore.fetchPages({
      status: statusFilter || null,
      slug: slugFilter,
    })
  }

  const handleStatusFilterChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target
    const nextStatus = (value as CmsStatus) || ''
    setStatusFilter(nextStatus)
    await cmsStore.fetchPages({
      status: nextStatus || null,
      slug: cmsStore.filters.slug,
    })
  }

  const handleResetFilters = async () => {
    setStatusFilter('')
    setSlugFilter('')
    await cmsStore.fetchPages({ status: null, slug: '' })
  }

  return (
    <div className={styles.container}>
      <aside className="card">
        <div className={styles.sidebarCard}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarHeading}>{t('sidebar.title')}</h2>
            <button
              type="button"
              onClick={resetForm}
              className={styles.buttonSecondary}
            >
              {t('sidebar.new_page')}
            </button>
          </div>
          <form className={styles.filterForm} onSubmit={handleFilterSubmit}>
            <label className={styles.filterField}>
              <span>{t('filters.slug.label')}</span>
              <input
                value={slugFilter}
                onChange={(event) => setSlugFilter(event.target.value)}
                placeholder={t('filters.slug.placeholder')}
              />
            </label>
            <label className={styles.filterField}>
              <span>{t('filters.status.label')}</span>
              <select value={statusFilter} onChange={handleStatusFilterChange}>
                <option value="">{t('filters.status.any')}</option>
                <option value="DRAFT">{statusLabel('DRAFT', t)}</option>
                <option value="PUBLISHED">{statusLabel('PUBLISHED', t)}</option>
                <option value="ARCHIVED">{statusLabel('ARCHIVED', t)}</option>
              </select>
            </label>
            <div className={styles.filterActions}>
              <button type="submit" className={styles.applyButton}>
                {t('filters.actions.apply')}
              </button>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handleResetFilters}
                disabled={!statusFilter && !slugFilter}
              >
                {t('filters.actions.clear')}
              </button>
            </div>
          </form>
          <div className={styles.pageList}>
            {sortedPages.map((page) => (
              <button
                type="button"
                key={page.id}
                className={classNames(styles.pageListItem, {
                  [styles.pageListItemActive]: form.id === page.id,
                })}
                onClick={() => handleSelect(page)}
              >
                <span>{page.title}</span>
                <span className={styles.statusBadge}>{statusLabel(page.status, t)}</span>
              </button>
            ))}
            {sortedPages.length === 0 && (
              <span className={styles.emptyState}>{t('sidebar.empty')}</span>
            )}
          </div>
        </div>
      </aside>

      <section className="card">
        <div className={styles.editorContainer}>
          <div className={styles.fieldGrid}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('form.fields.slug')}</span>
              <input
                value={form.slug}
                onChange={(event) => handleChange('slug', event.target.value)}
                placeholder={t('form.placeholders.slug')}
                required
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('form.fields.title')}</span>
              <input
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                required
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('form.fields.excerpt')}</span>
              <input
                value={form.excerpt}
                onChange={(event) => handleChange('excerpt', event.target.value)}
                placeholder={t('form.placeholders.excerpt')}
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('form.fields.status')}</span>
              <select
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value as CmsStatus)}
              >
                <option value="DRAFT">{statusLabel('DRAFT', t)}</option>
                <option value="PUBLISHED">{statusLabel('PUBLISHED', t)}</option>
                <option value="ARCHIVED">{statusLabel('ARCHIVED', t)}</option>
              </select>
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('form.fields.schedule')}</span>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) => handleChange('publishedAt', event.target.value)}
              />
            </label>
          </div>

          <div>
            <span className={styles.richTextLabel}>{t('form.fields.body')}</span>
            <RichTextEditor
              value={form.body}
              onChange={(value) => handleChange('body', value)}
              placeholder={t('form.placeholders.body')}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleSave}
              disabled={cmsStore.saving || (form.id ? !isDirty : false)}
            >
              {form.id ? t('form.actions.update') : t('form.actions.create')}
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={handleDiscard}
              disabled={!isDirty || cmsStore.saving}
            >
              {t('form.actions.discard')}
            </button>
            {form.id && (
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handlePublish}
                disabled={cmsStore.saving || form.status === 'PUBLISHED'}
              >
                {t('form.actions.publish')}
              </button>
            )}
          </div>

          {cmsStore.error && (
            <span className={styles.errorMessage}>{cmsStore.error}</span>
          )}

          {form.id && cmsStore.selectedPage && (
            <div className={styles.metaGrid}>
              <span>
                {t('meta.updated_at')}{' '}
                {new Date(cmsStore.selectedPage.updatedAt).toLocaleString()}
              </span>
              {cmsStore.selectedPage.publishedAt && (
                <span>
                  {t('meta.published_at')}{' '}
                  {new Date(cmsStore.selectedPage.publishedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {form.id && (
            <div className={styles.dangerZone}>
              <button
                type="button"
                onClick={handleDelete}
                className={styles.deleteButton}
              >
                {t('form.actions.delete')}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
})

export default CmsPageRoute
