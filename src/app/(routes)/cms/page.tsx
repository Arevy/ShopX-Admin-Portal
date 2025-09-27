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
import type { CmsPage, CmsStatus } from '@/types/domain'
import styles from './CmsPage.module.scss'

const defaultForm = () => ({
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  body: '',
  status: 'DRAFT' as CmsStatus,
  publishedAt: '',
})

const CmsPageRoute = observer(() => {
  const cmsStore = useCms()
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

  const populateForm = useCallback((page: CmsPage | null) => {
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
  }, [])

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
      cmsStore.error = 'Slug, title, and content are required.'
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
    const confirmation = window.confirm('Are you sure you want to delete this page?')
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>CMS pages</h2>
            <button
              type="button"
              onClick={resetForm}
              className={styles.buttonSecondary}
            >
              + New page
            </button>
          </div>
          <form className={styles.filterForm} onSubmit={handleFilterSubmit}>
            <label className={styles.filterField}>
              <span>Slug contains</span>
              <input
                value={slugFilter}
                onChange={(event) => setSlugFilter(event.target.value)}
                placeholder="gift-guide-holidays"
              />
            </label>
            <label className={styles.filterField}>
              <span>Status</span>
              <select value={statusFilter} onChange={handleStatusFilterChange}>
                <option value="">Any status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <div className={styles.filterActions}>
              <button type="submit" className={styles.applyButton}>
                Apply filters
              </button>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handleResetFilters}
                disabled={!statusFilter && !slugFilter}
              >
                Clear
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
                <span className={styles.statusBadge}>{page.status.toLowerCase()}</span>
              </button>
            ))}
            {sortedPages.length === 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No pages available yet.
              </span>
            )}
          </div>
        </div>
      </aside>

      <section className="card">
        <div className={styles.editorContainer}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(event) => handleChange('slug', event.target.value)}
                placeholder="ex: homepage"
                required
              />
            </label>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                required
              />
            </label>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              <span>Short description</span>
              <input
                value={form.excerpt}
                onChange={(event) => handleChange('excerpt', event.target.value)}
                placeholder="Optional – used in previews."
              />
            </label>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value as CmsStatus)}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              <span>Schedule publish</span>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) => handleChange('publishedAt', event.target.value)}
              />
            </label>
          </div>

          <div>
            <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Content</span>
            <RichTextEditor
              value={form.body}
              onChange={(value) => handleChange('body', value)}
              placeholder="Write the content for your page..."
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleSave}
              disabled={cmsStore.saving || (form.id ? !isDirty : false)}
            >
              {form.id ? 'Save changes' : 'Create page'}
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={handleDiscard}
              disabled={!isDirty || cmsStore.saving}
            >
              Discard
            </button>
            {form.id && (
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handlePublish}
                disabled={cmsStore.saving || form.status === 'PUBLISHED'}
              >
                Publish now
              </button>
            )}
          </div>

          {cmsStore.error && (
            <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{cmsStore.error}</span>
          )}

          {form.id && cmsStore.selectedPage && (
            <div className={styles.metaGrid}>
              <span>
                Last updated: {new Date(cmsStore.selectedPage.updatedAt).toLocaleString('en-US')}
              </span>
              {cmsStore.selectedPage.publishedAt && (
                <span>
                  Published at: {new Date(cmsStore.selectedPage.publishedAt).toLocaleString('en-US')}
                </span>
              )}
            </div>
          )}

          {form.id && (
            <div className={styles.dangerZone}>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  borderRadius: '999px',
                  padding: '0.55rem 1rem',
                }}
              >
                Delete page
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
})

export default CmsPageRoute
