import { createOfdPreview } from '@zhuyunjing/file-viewer-ofd';

function createHistoryItem(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    name: file.name,
    size: file.size,
    addedAt: new Date(),
    pageCount: 0,
    status: 'idle',
    errorMessage: ''
  };
}

function isOfdFile(file) {
  return Boolean(file && file.name && file.name.toLowerCase().endsWith('.ofd'));
}

export default {
  template: `
    <div :data-theme="themeName" class="app-shell min-h-screen transition-colors duration-300">
      <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header class="hero-panel surface-card card border border-base-300/70 bg-base-100/82 shadow-xl backdrop-blur">
          <div class="card-body gap-6 p-6 xl:p-8">
            <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div class="max-w-3xl">
                <p class="text-xs font-semibold uppercase tracking-[0.28em] text-primary">OFD Preview</p>
                <h1 class="mt-3 text-4xl font-semibold tracking-tight text-base-content sm:text-5xl">OFD 预览</h1>
                <p class="mt-4 max-w-2xl text-sm leading-7 text-base-content/70 sm:text-base">
                  这个网页用于在浏览器里直接打开本地 OFD 文件。支持当前会话上传历史、右侧即时预览、翻页、页码跳转和缩放；
                  文件只在浏览器本地处理，刷新或离开页面后历史会自动清空。
                </p>

                <div class="mt-5 flex flex-wrap gap-2">
                  <span class="feature-badge badge badge-outline">本地解析</span>
                  <span class="feature-badge badge badge-outline">会话历史</span>
                  <span class="feature-badge badge badge-outline">无后端依赖</span>
                </div>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
                <button
                  type="button"
                  class="theme-toggle-btn btn btn-outline rounded-full"
                  @click="toggleTheme"
                >
                  {{ isDark ? '切换到 Light' : '切换到 Dark' }}
                </button>

                <label class="upload-btn btn btn-primary rounded-full">
                  <input
                    class="hidden"
                    type="file"
                    accept=".ofd,application/ofd"
                    multiple
                    @change="handleInputChange"
                  />
                  添加 OFD 文件
                </label>

                <p class="text-right text-xs leading-6 text-base-content/60">
                  当前会话已上传 {{ historyItems.length }} 个文件
                </p>
              </div>
            </div>
          </div>
        </header>

        <main class="mt-6 grid flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,820px)] xl:justify-between">
          <aside class="surface-card card border border-base-300/70 bg-base-100/80 shadow-xl backdrop-blur">
            <div class="card-body gap-0 p-0">
              <div class="border-b border-base-300/70 px-5 py-5">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h2 class="text-lg font-semibold text-base-content">当前上传历史</h2>
                    <p class="mt-1 text-sm leading-6 text-base-content/65">
                      只保留在本次页面会话中，刷新或离开后即清空。
                    </p>
                  </div>
                  <span class="badge badge-outline badge-lg">{{ historyItems.length }}</span>
                </div>
              </div>

              <div class="max-h-[calc(100vh-16rem)] overflow-y-auto px-3 py-3">
                <div
                  v-if="!historyItems.length"
                  class="rounded-3xl border border-dashed border-base-300 bg-base-200/50 px-4 py-6 text-sm leading-7 text-base-content/60"
                >
                  还没有上传文件。点击上方“添加 OFD 文件”，或将文件拖到右侧预览区域。
                </div>

                <div v-else class="space-y-2">
                  <button
                    v-for="item in historyItems"
                    :key="item.id"
                    type="button"
                    @click="openHistoryItem(item.id)"
                    :class="['history-entry', historyItemClass(item)]"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium" :title="item.name">{{ item.name }}</p>
                        <p class="mt-1 text-xs text-base-content/55">
                          {{ formatTime(item.addedAt) }} · {{ formatSize(item.size) }}
                        </p>
                      </div>
                      <span :class="historyBadgeClass(item)">{{ historyTag(item) }}</span>
                    </div>

                    <p
                      v-if="item.errorMessage"
                      class="mt-3 line-clamp-2 text-xs leading-5 text-error"
                    >
                      {{ item.errorMessage }}
                    </p>

                    <p
                      v-else
                      class="mt-3 text-xs leading-5 text-base-content/60"
                    >
                      {{ item.pageCount ? ('共 ' + item.pageCount + ' 页') : '点击后在右侧打开预览' }}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <section
            :class="['surface-card viewer-panel card border border-base-300/70 bg-base-100/82 shadow-xl backdrop-blur transition', isDragging ? 'ring-2 ring-primary/50' : '']"
            @dragenter.prevent="onDragEnter"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
          >
            <div class="card-body min-h-[600px] gap-0 p-0 lg:h-[calc(100vh-16rem)]">
              <div class="border-b border-base-300/70 px-5 py-4 sm:px-6">
                <div class="space-y-3">
                  <p class="truncate text-base font-semibold text-base-content">
                    {{ activeHistoryItem ? activeHistoryItem.name : '未选择文件' }}
                  </p>

                  <p class="text-sm leading-6 text-base-content/65">
                    {{ statusText || '从左侧选择一条上传历史，或将 OFD 文件拖到当前区域开始预览。' }}
                  </p>

                  <div class="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
                    <div class="join">
                      <button
                        type="button"
                        class="tool-btn btn btn-sm join-item"
                        @click="goPrevPage"
                        :disabled="!canGoPrev"
                      >
                        上一页
                      </button>
                      <button
                        type="button"
                        class="tool-btn btn btn-sm join-item"
                        @click="goNextPage"
                        :disabled="!canGoNext"
                      >
                        下一页
                      </button>
                    </div>

                    <form class="flex items-center gap-2" @submit.prevent="jumpToPage">
                      <label class="text-sm text-base-content/60" for="page-input">页码</label>
                      <input
                        id="page-input"
                        v-model="pageInput"
                        class="page-input input input-sm input-bordered w-20"
                        inputmode="numeric"
                        :disabled="!pageCount"
                      />
                      <span class="text-sm text-base-content/60">/ {{ pageCount || 0 }}</span>
                      <button type="submit" class="tool-btn btn btn-sm btn-outline" :disabled="!pageCount">
                        跳转
                      </button>
                    </form>

                    <div class="join">
                      <button
                        type="button"
                        class="tool-btn btn btn-sm join-item"
                        @click="zoomOut"
                        :disabled="!hasDocument"
                      >
                        缩小
                      </button>
                      <button
                        type="button"
                        class="tool-btn btn btn-sm join-item"
                        @click="zoomIn"
                        :disabled="!hasDocument"
                      >
                        放大
                      </button>
                      <button
                        type="button"
                        class="tool-btn btn btn-sm join-item"
                        @click="fitWidth"
                        :disabled="!hasDocument"
                      >
                        适宽
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="relative flex-1 overflow-hidden p-3 sm:p-4">
                <div
                  v-if="isLoading"
                  class="loading-state absolute inset-3 z-20 grid place-items-center rounded-[1.25rem] bg-base-100/92 text-center backdrop-blur sm:inset-4"
                >
                  <div>
                    <span class="loading loading-spinner loading-lg text-primary"></span>
                    <p class="mt-4 text-base font-medium text-base-content">正在解析并渲染 OFD 文档...</p>
                    <p class="mt-2 text-sm text-base-content/65">请稍候，复杂文档可能需要更多时间。</p>
                  </div>
                </div>

                <div
                  v-else-if="errorMessage"
                  class="error-state absolute inset-3 z-20 grid place-items-center rounded-[1.25rem] bg-error/8 px-6 text-center sm:inset-4"
                >
                  <div class="max-w-lg">
                    <p class="text-lg font-semibold text-error">预览失败</p>
                    <p class="mt-3 text-sm leading-7 text-error/80">{{ errorMessage }}</p>
                  </div>
                </div>

                <div
                  v-else-if="!hasDocument"
                  class="empty-state absolute inset-3 z-10 grid place-items-center rounded-[1.25rem] border border-dashed border-base-300 bg-base-200/45 px-6 text-center sm:inset-4"
                >
                  <div class="max-w-xl">
                    <p class="text-xl font-semibold text-base-content">等待打开 OFD 文件</p>
                    <p class="mt-3 text-sm leading-7 text-base-content/65">
                      点击顶部“添加 OFD 文件”，或将 OFD 文件拖到当前区域。上传后文件会出现在左侧历史中，点击任意一条即可在右侧重新预览。
                    </p>
                  </div>
                </div>

                <div
                  ref="viewerHost"
                  class="viewer-host viewer-canvas relative h-full min-h-[440px] overflow-auto rounded-[1.25rem] bg-base-200/40"
                ></div>
              </div>
            </div>
          </section>
        </main>

        <footer class="mt-4 px-1 text-right text-xs tracking-[0.18em] text-base-content/45">
          © 2026 weiensong
        </footer>
      </div>
    </div>
  `,
  data() {
    return {
      preview: null,
      historyItems: [],
      activeHistoryId: null,
      loadRequestId: 0,
      themeMode: 'light',
      pageCount: 0,
      currentPage: 1,
      pageInput: '1',
      zoomLevel: 1,
      zoomMode: 'fit',
      isLoading: false,
      isDragging: false,
      errorMessage: ''
    };
  },
  computed: {
    isDark() {
      return this.themeMode === 'dark';
    },
    themeName() {
      return this.isDark ? 'dark' : 'light';
    },
    activeHistoryItem() {
      return this.historyItems.find((item) => item.id === this.activeHistoryId) || null;
    },
    hasDocument() {
      return Boolean(this.preview && this.pageCount);
    },
    canGoPrev() {
      return this.hasDocument && this.currentPage > 1;
    },
    canGoNext() {
      return this.hasDocument && this.currentPage < this.pageCount;
    },
    statusText() {
      if (!this.hasDocument) {
        return '';
      }

      const zoomText = this.zoomMode === 'fit' ? '适宽' : `${Math.round(this.zoomLevel * 100)}%`;
      return `第 ${this.currentPage} / ${this.pageCount} 页 · 缩放 ${zoomText}`;
    }
  },
  mounted() {
    this.applyTheme();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this.destroyPreview();
  },
  methods: {
    applyTheme() {
      document.documentElement.style.colorScheme = this.isDark ? 'dark' : 'light';
    },
    toggleTheme() {
      this.themeMode = this.isDark ? 'light' : 'dark';
      this.applyTheme();
    },
    handleInputChange(event) {
      this.addFiles(event.target.files);
      event.target.value = '';
    },
    onDragEnter() {
      this.isDragging = true;
    },
    onDragOver() {
      this.isDragging = true;
    },
    onDragLeave(event) {
      if (event.currentTarget === event.target) {
        this.isDragging = false;
      }
    },
    onDrop(event) {
      this.isDragging = false;
      this.addFiles(event.dataTransfer?.files);
    },
    addFiles(fileList) {
      const files = Array.from(fileList || []);
      const validFiles = files.filter(isOfdFile);

      if (!validFiles.length) {
        this.errorMessage = '仅支持选择 .ofd 文件。';
        return;
      }

      const items = validFiles.map(createHistoryItem);
      this.historyItems = [...items, ...this.historyItems];
      this.openHistoryItem(items[0].id);
    },
    historyTag(item) {
      if (item.status === 'loading') {
        return '加载中';
      }

      if (item.status === 'error') {
        return '失败';
      }

      if (item.status === 'ready') {
        return '已加载';
      }

      return '未打开';
    },
    historyItemClass(item) {
      const isActive = item.id === this.activeHistoryId;
      const baseClass = 'w-full rounded-3xl border px-4 py-4 text-left transition';

      if (isActive) {
        return `${baseClass} history-entry-active border-primary/30 bg-primary/10 shadow-sm`;
      }

      return `${baseClass} border-base-300 bg-base-100 hover:border-primary/20 hover:bg-base-200/55`;
    },
    historyBadgeClass(item) {
      const baseClass = 'badge shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium';

      if (item.status === 'error') {
        return `${baseClass} badge-error badge-outline`;
      }

      if (item.status === 'loading') {
        return `${baseClass} badge-warning badge-outline`;
      }

      if (item.status === 'ready') {
        return `${baseClass} history-badge-ready`;
      }

      return `${baseClass} badge-ghost`;
    },
    formatTime(date) {
      return new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    formatSize(size) {
      if (!Number.isFinite(size)) {
        return '-';
      }

      if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
      }

      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    },
    async openHistoryItem(id) {
      const item = this.historyItems.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      const requestId = ++this.loadRequestId;
      this.activeHistoryId = id;
      this.isLoading = true;
      this.errorMessage = '';
      this.pageCount = 0;
      this.currentPage = 1;
      this.pageInput = '1';
      this.zoomLevel = 1;
      this.zoomMode = 'fit';
      item.status = 'loading';
      item.errorMessage = '';

      this.destroyPreview();

      if (this.$refs.viewerHost) {
        this.$refs.viewerHost.innerHTML = '';
      }

      try {
        const preview = await this.createPreview(item.file);

        if (requestId !== this.loadRequestId) {
          preview?.destroy();
          return;
        }

        const pageCount = preview.getDocumentInfo()?.numPages || 0;
        if (!pageCount) {
          throw new Error('文档已解析，但未识别到页面信息。');
        }

        this.preview = preview;
        this.pageCount = pageCount;
        item.pageCount = pageCount;
        item.status = 'ready';
        this.fitWidth();
      } catch (error) {
        if (requestId !== this.loadRequestId) {
          return;
        }

        const message = error instanceof Error ? error.message : '未知错误';
        this.preview = null;
        this.errorMessage = message;
        item.pageCount = 0;
        item.status = 'error';
        item.errorMessage = message;
      } finally {
        if (requestId === this.loadRequestId) {
          this.isLoading = false;
        }
      }
    },
    createPreview(file) {
      return new Promise((resolve, reject) => {
        let preview = null;

        preview = createOfdPreview({
          container: this.$refs.viewerHost,
          file,
          showToolbar: false,
          renderAllPages: true,
          scale: 'auto',
          onLoad: () => resolve(preview),
          onError: (error) => {
            preview?.destroy();
            reject(error instanceof Error ? error : new Error(String(error || '预览失败')));
          }
        });
      });
    },
    destroyPreview() {
      if (this.preview) {
        this.preview.destroy();
        this.preview = null;
      }
    },
    goPrevPage() {
      if (!this.canGoPrev) {
        return;
      }

      this.preview.prevPage();
      this.setCurrentPage(this.currentPage - 1);
    },
    goNextPage() {
      if (!this.canGoNext) {
        return;
      }

      this.preview.nextPage();
      this.setCurrentPage(this.currentPage + 1);
    },
    jumpToPage() {
      if (!this.hasDocument) {
        return;
      }

      const target = Number.parseInt(this.pageInput, 10);
      if (!Number.isInteger(target) || target < 1 || target > this.pageCount) {
        this.pageInput = String(this.currentPage);
        return;
      }

      this.preview.goToPage(target);
      this.setCurrentPage(target);
    },
    zoomIn() {
      if (!this.hasDocument) {
        return;
      }

      this.preview.zoomIn();
      this.zoomMode = 'custom';
      this.zoomLevel = typeof this.preview.currentScale === 'number'
        ? Number(this.preview.currentScale.toFixed(2))
        : Number((this.zoomLevel * 1.25).toFixed(2));
    },
    zoomOut() {
      if (!this.hasDocument) {
        return;
      }

      this.preview.zoomOut();
      this.zoomMode = 'custom';
      this.zoomLevel = typeof this.preview.currentScale === 'number'
        ? Number(this.preview.currentScale.toFixed(2))
        : Number((this.zoomLevel * 0.8).toFixed(2));
    },
    fitWidth() {
      if (!this.hasDocument) {
        return;
      }

      this.preview.setScale('auto');
      this.zoomMode = 'fit';
      this.zoomLevel = 1;
    },
    handleResize() {
      if (this.hasDocument && this.zoomMode === 'fit') {
        this.fitWidth();
      }
    },
    setCurrentPage(page) {
      this.currentPage = page;
      this.pageInput = String(page);
    }
  }
};
