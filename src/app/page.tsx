'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import styles from './page.module.css'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [transferring, setTransferring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return

    const MAX_SIZE_MB = 100
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`ファイルサイズが大きすぎます（上限: ${MAX_SIZE_MB}MB）`)
      return
    }

    setUploading(true)
    setProgress(0)
    setTransferring(false)
    setError(null)
    setUrl(null)

    let signData: { timestamp: number; signature: string; api_key: string; cloud_name: string; folder: string }
    try {
      const signRes = await fetch('/api/sign-upload', { method: 'POST' })
      signData = await signRes.json()
    } catch {
      setError('アップロードに失敗しました')
      setUploading(false)
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signData.api_key)
    formData.append('timestamp', signData.timestamp.toString())
    formData.append('signature', signData.signature)
    formData.append('folder', signData.folder)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100)
        setProgress(pct)
        if (pct === 100) setTransferring(true)
      }
    }

    xhr.onload = () => {
      setTransferring(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText)
        setUrl(data.secure_url)
      } else {
        try {
          const errData = JSON.parse(xhr.responseText)
          setError(`アップロードに失敗しました (${xhr.status}): ${errData?.error?.message ?? xhr.responseText}`)
        } catch {
          setError(`アップロードに失敗しました (${xhr.status})`)
        }
      }
      setUploading(false)
    }

    xhr.onerror = () => {
      setTransferring(false)
      setError('アップロードに失敗しました（ネットワークエラー）')
      setUploading(false)
    }

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloud_name}/video/upload`)
    xhr.send(formData)
  }

  const handleCopy = () => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setFile(null)
    setUrl(null)
    setError(null)
    setProgress(0)
    setTransferring(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>動画URLジェネレッサー</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.dropzone} onClick={() => inputRef.current?.click()}>
          <Image
            src={file ? '/movie1.png' : '/movie2.png'}
            alt="レッサーニャンコ"
            width={140}
            height={140}
          />
          {file ? (
            <p className={styles.filename}>{file.name}</p>
          ) : (
            <>
              <p className={styles.placeholderDesktop}>クリックして動画ファイルを選択</p>
              <p className={styles.placeholderMobile}>タッチして動画ファイルを選択</p>
            </>
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
          {uploading ? (transferring ? '処理中...' : 'アップロード中...') : 'アップロード🐾'}
        </button>

        {uploading && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill}${transferring ? ` ${styles.progressPulse}` : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={styles.progressLabel}>
              {transferring ? 'Cloudinaryで処理中...' : `${progress}%`}
            </p>
          </div>
        )}

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
            <button className={styles.resetButton} onClick={handleReset}>
              リセット
            </button>
          </div>
        )}
      </div>
    </div>
  )
}