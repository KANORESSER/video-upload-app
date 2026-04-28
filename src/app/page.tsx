'use client'

import { useState, useRef } from 'react'
import styles from './page.module.css'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setUrl(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'アップロードに失敗しました')
    } else {
      setUrl(data.url)
    }
    setUploading(false)
  }

  const handleCopy = () => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div>
          <h1 className={styles.heading}>動画アップロード</h1>
          <p className={styles.subheading}>mp4などの動画ファイルをURLに変換します</p>
        </div>

        <div className={styles.dropzone} onClick={() => inputRef.current?.click()}>
          <span className={styles.emoji}>🎬</span>
          {file ? (
            <p className={styles.filename}>{file.name}</p>
          ) : (
            <p className={styles.placeholder}>クリックして動画ファイルを選択</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setUrl(null)
              setError(null)
            }}
          />
        </div>

        <button
          className={styles.uploadButton}
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>

        {error && <p className={styles.error}>{error}</p>}

        {url && (
          <div className={styles.urlSection}>
            <p className={styles.urlLabel}>生成されたURL</p>
            <div className={styles.urlRow}>
              <input className={styles.urlInput} readOnly value={url} />
              <button className={styles.copyButton} onClick={handleCopy}>
                {copied ? 'コピー済み' : 'コピー'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}