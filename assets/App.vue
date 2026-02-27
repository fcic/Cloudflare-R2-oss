<template>
  <div class="main" @dragenter.prevent @dragover.prevent @drop.prevent="onDrop">
    <progress
      v-if="uploadProgress !== null"
      :value="uploadProgress"
      max="100"
    ></progress>
    <UploadPopup
      v-model="showUploadPopup"
      @upload="onUploadClicked"
      @cameraUpload="onCameraUploadClicked"
      @createFolder="createFolder"
      @createText="createText"
    ></UploadPopup>
    <button v-show="!showUploadPopup" class="create-text-button circle" @click="createText" title="新建文本">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="22" height="22" style="fill: white">
        <path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V288H216c-13.3 0-24 10.7-24 24s10.7 24 24 24H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128zM432 288c-13.3 0-24 10.7-24 24v48H360c-13.3 0-24 10.7-24 24s10.7 24 24 24h48v48c0 13.3 10.7 24 24 24s24-10.7 24-24V408h48c13.3 0 24-10.7 24-24s-10.7-24-24-24H456V312c0-13.3-10.7-24-24-24z"/>
      </svg>
    </button>
    <button v-show="!showUploadPopup" class="upload-button circle" @click="showUploadPopup = true">
      <img
        style="filter: invert(100%)"
        src="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/4.0.0/png/file/upload_file/materialicons/36dp/2x/baseline_upload_file_black_36dp.png"
        alt="Upload"
        width="28"
        height="28"
        @contextmenu.prevent
      />
    </button>
    <div class="app-bar">
      <input type="search" v-model="search" aria-label="Search" placeholder="搜索..." />
      <div class="menu-button">
        <button class="circle" @click="showMenu = true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            width="18"
            height="18"
            title="Menu"
            style="display: block; margin: 2px"
          >
            <path
              d="M120 256c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm160 0c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm104 56c-30.9 0-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56s-25.1 56-56 56z"
            />
          </svg>
        </button>
        <Menu
          v-model="showMenu"
          :items="[{ text: '名称A-Z' }, { text: '大小↑' } ,{ text: '大小↓' }, { text: '粘贴' }]"
          @click="onMenuClick"
        />
      </div>
    </div>
    <ul class="file-list">
      <li v-if="cwd !== ''">
        <div
          tabindex="0"
          class="file-item"
          @click="cwd = cwd.replace(/[^\/]+\/$/, '')"
          @contextmenu.prevent
        >
          <div class="file-icon">
            <img
              src="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/4.0.0/png/file/folder/materialicons/36dp/2x/baseline_folder_black_36dp.png"
              width="22"
              height="22"
              alt="Folder"
            />
          </div>
          <span class="file-name">..</span>
        </div>
      </li>
      <li v-for="folder in filteredFolders" :key="folder">
        <div
          tabindex="0"
          class="file-item"
          @click="cwd = folder"
          @contextmenu.prevent="
            showContextMenu = true;
            focusedItem = folder;
          "
        >
          <div class="file-icon">
            <img
              src="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/4.0.0/png/file/folder/materialicons/36dp/2x/baseline_folder_black_36dp.png"
              width="22"
              height="22"
              alt="Folder"
            />
          </div>
          <span
            class="file-name"
            v-text="folder.match(/.*?([^/]*)\/?$/)[1]"
          ></span>
          <div class="item-action"
            @click.stop="
              showContextMenu = true;
              focusedItem = folder;
            "
            >
              <svg viewBox="0 0 24 24" style="height: 18px; width: 18px;"><path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"></path></svg>
          </div>
        </div>
      </li>
      <li v-for="file in filteredFiles" :key="file.key">
        <div
          @click="onFileClick(file)"
          @contextmenu.prevent="
            showContextMenu = true;
            focusedItem = file;
          "
        >
          <div class="file-item">
            <MimeIcon
              :content-type="file.httpMetadata.contentType"
              :thumbnail="
                file.customMetadata.thumbnail
                  ? `/raw/_$flaredrive$/thumbnails/${file.customMetadata.thumbnail}.png`
                  : null
              "
              :size="22"
            />
            <div>
              <div class="file-name" v-text="file.key.split('/').pop()"></div>
              <div class="file-attr">
                <span v-text="new Date(file.uploaded).toLocaleString()"></span>
                <span v-text="formatSize(file.size)"></span>
              </div>
            </div>
            <div class="item-action"
            @click.stop="
              showContextMenu = true;
              focusedItem = file;
            "
            >
              <svg viewBox="0 0 24 24" style="height: 18px; width: 18px;"><path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"></path></svg>
            </div>
          </div>
        </div>
      </li>
    </ul>
    <div v-if="loading" style="margin-top: 12px; text-align: center; color: var(--text-muted); font-size: 10px">
      <span>加载中...</span>
    </div>
    <div
      v-else-if="!filteredFiles.length && !filteredFolders.length"
      style="margin-top: 12px; text-align: center; color: var(--text-muted); font-size: 10px"
    >
      <span>没有文件</span>
    </div>
    <Dialog v-model="showContextMenu">
      <div
        v-text="focusedItem.key || focusedItem"
        class="contextmenu-filename"
        @click.stop.prevent
      ></div>
      <ul v-if="typeof focusedItem === 'string'" class="contextmenu-list">
        <li>
          <button @click="copyLink(`/?p=${encodeURIComponent(focusedItem)}`)">
            <span>复制链接</span>
          </button>
        </li>
        <li>
          <button @click="moveFile(focusedItem + '_$folder$')">
            <span>移动</span>
          </button>
        </li>
        <li>
          <button
            style="color: var(--danger)"
            @click="removeFile(focusedItem + '_$folder$')"
          >
            <span>删除</span>
          </button>
        </li>
      </ul>
      <ul v-else class="contextmenu-list">
        <li v-if="isTextFile(focusedItem)">
          <button @click="openTextEditor(focusedItem)">
            <span>编辑</span>
          </button>
        </li>
        <li>
          <button @click="renameFile(focusedItem.key)">
            <span>重命名</span>
          </button>
        </li>
        <li>
          <a :href="`/raw/${focusedItem.key}`" target="_blank" download>
            <span>下载</span>
          </a>
        </li>
        <li>
          <button @click="clipboard = focusedItem.key">
            <span>复制</span>
          </button>
        </li>
        <li>
          <button @click="moveFile(focusedItem.key)">
            <span>移动</span>
          </button>
        </li>
        <li>
          <button @click="copyLink(`/raw/${focusedItem.key}`)">
            <span>复制链接</span>
          </button>
        </li>
        <li>
          <button style="color: var(--danger)" @click="removeFile(focusedItem.key)">
            <span>删除</span>
          </button>
        </li>
      </ul>
    </Dialog>

    <!-- Text Editor Dialog -->
    <Dialog v-model="showTextEditor">
      <div class="text-editor">
        <div class="text-editor-header">
          <span class="text-editor-title" v-text="editingFileName"></span>
          <div class="text-editor-actions">
            <button class="text-editor-btn save" @click="saveTextFile">保存</button>
            <button class="text-editor-btn cancel" @click="showTextEditor = false">关闭</button>
          </div>
        </div>
        <textarea
          class="text-editor-content"
          v-model="editContent"
          spellcheck="false"
        ></textarea>
      </div>
    </Dialog>
  </div>
</template>

<script>
import {
  generateThumbnail,
  blobDigest,
  multipartUpload,
  SIZE_LIMIT,
} from "/assets/main.mjs";
import Dialog from "./Dialog.vue";
import Menu from "./Menu.vue";
import MimeIcon from "./MimeIcon.vue";
import UploadPopup from "./UploadPopup.vue";

const TEXT_EXTENSIONS = [
  'txt','md','json','xml','html','htm','css','js','ts','jsx','tsx',
  'yaml','yml','csv','log','sh','bat','py','rb','go','java','c','cpp',
  'h','hpp','conf','cfg','ini','env','toml','sql','php','rs','swift',
  'kt','lua','pl','r','dart','vue','svelte','scss','sass','less',
  'makefile','dockerfile','gitignore','editorconfig','properties',
];

const TEXT_CONTENT_TYPES = [
  'text/', 'application/json', 'application/xml', 'application/javascript',
  'application/x-yaml', 'application/toml', 'application/sql',
  'application/x-sh', 'application/x-httpd-php',
];

export default {
  data: () => ({
    cwd: new URL(window.location).searchParams.get("p") || "",
    files: [],
    folders: [],
    clipboard: null,
    focusedItem: null,
    loading: false,
    order: null,
    search: "",
    showContextMenu: false,
    showMenu: false,
    showUploadPopup: false,
    showTextEditor: false,
    editingFileKey: "",
    editingFileName: "",
    editContent: "",
    uploadProgress: null,
    uploadQueue: [],
  }),

  computed: {
    filteredFiles() {
      let files = this.files;
      if (this.search) {
        files = files.filter((file) =>
          file.key.split("/").pop().includes(this.search)
        );
      }
      return files;
    },

    filteredFolders() {
      let folders = this.folders;
      if (this.search) {
        folders = folders.filter((folder) => folder.includes(this.search));
      }
      return folders;
    },
  },

  methods: {
    copyLink(link) {
      const url = new URL(link, window.location.origin);
      navigator.clipboard.writeText(url.toString());
    },

    async copyPaste(source, target) {
      const uploadUrl = `/api/write/items/${target}`;
      await axios.put(uploadUrl, "", {
        headers: { "x-amz-copy-source": encodeURIComponent(source) },
      });
    },

    async createFolder() {
      try {
        const folderName = window.prompt("请输入文件夹名称");
        if (!folderName) return;
        this.showUploadPopup = false;
        const uploadUrl = `/api/write/items/${this.cwd}${folderName}/_$folder$`;
        await axios.put(uploadUrl, "");
        this.fetchFiles();
      } catch (error) {
        fetch("/api/write/")
          .then((value) => {
            if (value.redirected) window.location.href = value.url;
          })
          .catch(() => {});
        console.log(`Create folder failed`);
      }
    },

    async createText() {
      try {
        let fileName = window.prompt("请输入文件名称", "新建文本.txt");
        if (!fileName) return;
        if (!fileName.includes('.')) fileName += '.txt';
        this.showUploadPopup = false;
        const uploadUrl = `/api/write/items/${this.cwd}${fileName}`;
        await axios.put(uploadUrl, "");
        this.fetchFiles();
        // Open editor immediately
        setTimeout(() => {
          const file = this.files.find(f => f.key === `${this.cwd}${fileName}`);
          if (file) this.openTextEditor(file);
        }, 300);
      } catch (error) {
        fetch("/api/write/")
          .then((value) => {
            if (value.redirected) window.location.href = value.url;
          })
          .catch(() => {});
        console.log(`Create text failed`);
      }
    },

    isTextFile(file) {
      if (!file || !file.httpMetadata) return false;
      const ct = file.httpMetadata.contentType || '';
      if (TEXT_CONTENT_TYPES.some(t => ct.startsWith(t))) return true;
      const ext = (file.key || '').split('.').pop().toLowerCase();
      return TEXT_EXTENSIONS.includes(ext);
    },

    async openTextEditor(file) {
      this.showContextMenu = false;
      this.editingFileKey = file.key;
      this.editingFileName = file.key.split('/').pop();
      try {
        const res = await fetch(`/raw/${file.key}`);
        this.editContent = await res.text();
        this.showTextEditor = true;
      } catch (e) {
        console.error('Failed to load file', e);
      }
    },

    async saveTextFile() {
      try {
        const uploadUrl = `/api/write/items/${this.editingFileKey}`;
        const blob = new Blob([this.editContent], { type: 'text/plain; charset=utf-8' });
        await axios.put(uploadUrl, blob);
        this.showTextEditor = false;
        this.fetchFiles();
      } catch (error) {
        fetch("/api/write/")
          .then((value) => {
            if (value.redirected) window.location.href = value.url;
          })
          .catch(() => {});
        console.error('Save failed', error);
        alert('保存失败');
      }
    },

    onFileClick(file) {
      if (this.isTextFile(file)) {
        this.openTextEditor(file);
      } else {
        this.preview(`/raw/${file.key}`);
      }
    },

    fetchFiles() {
      this.files = [];
      this.folders = [];
      this.loading = true;
      fetch(`/api/children/${this.cwd}`)
        .then((res) => res.json())
        .then((files) => {
          this.files = files.value;
          if (this.order) {
            this.files.sort((a, b) => {
              if (this.order === "size") {
                return b.size - a.size;
              }
            });
          }
          this.folders = files.folders;
          this.loading = false;
        });
    },

    formatSize(size) {
      const units = ["B", "KB", "MB", "GB", "TB"];
      let i = 0;
      while (size >= 1024) {
        size /= 1024;
        i++;
      }
      return `${size.toFixed(1)} ${units[i]}`;
    },

    getDateTimeFilename(ext) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.${ext}`;
    },

    onDrop(ev) {
      let files;
      if (ev.dataTransfer.items) {
        files = [...ev.dataTransfer.items]
          .filter((item) => item.kind === "file")
          .map((item) => item.getAsFile());
      } else files = ev.dataTransfer.files;
      this.uploadFiles(files);
    },

    onMenuClick(text) {
      switch (text) {
        case "名称A-Z":
          this.order = null;
          break;
        case "大小↑":
          this.order = "大小↑";
          break;
        case "大小↓":
          this.order = "大小↓";
          break;
        case "粘贴":
          return this.pasteFile();
      }
      this.files.sort((a, b) => {
        if (this.order === "大小↑") {
          return a.size - b.size;
        } else if (this.order === "大小↓") {
          return b.size - a.size;
        } else {
          return a.key.localeCompare(b.key);
        }
      });
    },

    onUploadClicked(fileElement) {
      if (!fileElement.value) return;
      this.uploadFiles(fileElement.files);
      this.showUploadPopup = false;
      fileElement.value = null;
    },

    onCameraUploadClicked(fileElement) {
      if (!fileElement.value) return;
      const files = Array.from(fileElement.files);
      const renamedFiles = files.map(file => {
        const ext = file.name.split('.').pop() || 'jpg';
        const newName = this.getDateTimeFilename(ext);
        return new File([file], newName, { type: file.type });
      });
      this.uploadFiles(renamedFiles);
      this.showUploadPopup = false;
      fileElement.value = null;
    },

    preview(filePath){
      window.open(filePath);
    },

    async pasteFile() {
      if (!this.clipboard) return;
      let newName = window.prompt("Rename to:");
      if (newName === null) return;
      if (newName === "") newName = this.clipboard.split("/").pop();
      await this.copyPaste(this.clipboard, `${this.cwd}${newName}`);
      this.fetchFiles();
    },

    async processUploadQueue() {
      if (!this.uploadQueue.length) {
        this.fetchFiles();
        this.uploadProgress = null;
        return;
      }

      /** @type File **/
      const { basedir, file } = this.uploadQueue.pop(0);
      let thumbnailDigest = null;

      if (file.type.startsWith("image/") || file.type === "video/mp4") {
        try {
          const thumbnailBlob = await generateThumbnail(file);
          const digestHex = await blobDigest(thumbnailBlob);

          const thumbnailUploadUrl = `/api/write/items/_$flaredrive$/thumbnails/${digestHex}.png`;
          try {
            await axios.put(thumbnailUploadUrl, thumbnailBlob);
            thumbnailDigest = digestHex;
          } catch (error) {
            fetch("/api/write/")
              .then((value) => {
                if (value.redirected) window.location.href = value.url;
              })
              .catch(() => {});
            console.log(`Upload ${digestHex}.png failed`);
          }
        } catch (error) {
          console.log(`Generate thumbnail failed`);
        }
      }

      try {
        const uploadUrl = `/api/write/items/${basedir}${file.name}`;
        const headers = {};
        const onUploadProgress = (progressEvent) => {
          var percentCompleted =
            (progressEvent.loaded * 100) / progressEvent.total;
          this.uploadProgress = percentCompleted;
        };
        if (thumbnailDigest) headers["fd-thumbnail"] = thumbnailDigest;
        if (file.size >= SIZE_LIMIT) {
          await multipartUpload(`${basedir}${file.name}`, file, {
            headers,
            onUploadProgress,
          });
        } else {
          await axios.put(uploadUrl, file, { headers, onUploadProgress });
        }
      } catch (error) {
        fetch("/api/write/")
          .then((value) => {
            if (value.redirected) window.location.href = value.url;
          })
          .catch(() => {});
        console.log(`Upload ${file.name} failed`, error);
      }
      setTimeout(this.processUploadQueue);
    },

    async removeFile(key) {
      if (!window.confirm(`确定要删除 ${key} 吗？`)) return;
      await axios.delete(`/api/write/items/${key}`);
      this.fetchFiles();
    },

    async renameFile(key) {
      const newName = window.prompt("重命名为:");
      if (!newName) return;
      await this.copyPaste(key, `${this.cwd}${newName}`);
      await axios.delete(`/api/write/items/${key}`);
      this.fetchFiles();
    },

    async moveFile(key) {
      const currentPath = this.cwd;
      const allFolders = [...this.folders];
      
      if (currentPath !== '') {
        const parentPath = currentPath.replace(/[^\/]+\/$/, '');
        if (!allFolders.includes(parentPath) && parentPath !== '') {
          allFolders.unshift(parentPath);
        }
      }
      
      if (!allFolders.includes('')) {
        allFolders.unshift('');
      }
      
      const folderOptions = allFolders.map(folder => {
        const displayName = folder === '' ? '根目录' : 
                          folder === currentPath ? '当前目录' :
                          folder.replace(/.*\/(?!$)|\//, '') + '/';
        return {
          display: displayName,
          value: folder
        };
      });
      
      const options = folderOptions.map((opt, index) => 
        `${index + 1}. ${opt.display}`
      ).join('\n');
      
      const promptText = `请选择目标目录(输入数字):\n${options}\n`;
      const selection = window.prompt(promptText);
      
      if (!selection) return;
      
      const selectedIndex = parseInt(selection) - 1;
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= folderOptions.length) {
        alert('无效的选择');
        return;
      }
      
      const targetPath = folderOptions[selectedIndex].value;
      
      const fileName = key.split('/').pop();
      const finalFileName = fileName.endsWith('_$folder$') ? fileName.slice(0, -9) : fileName;
      
      const normalizedPath = targetPath === '' ? '' : (targetPath.endsWith('/') ? targetPath : targetPath + '/');
      
      try {
        if (key.endsWith('_$folder$')) {
          const sourceBasePath = key.slice(0, -9);
          const targetBasePath = normalizedPath + finalFileName + '/';
          
          const allItems = await this.getAllItems(sourceBasePath);
          
          const totalItems = allItems.length;
          let processedItems = 0;
          
          for (const item of allItems) {
            const relativePath = item.key.substring(sourceBasePath.length);
            const newPath = targetBasePath + relativePath;
            
            try {
              await this.copyPaste(item.key, newPath);
              await axios.delete(`/api/write/items/${item.key}`);
              
              processedItems++;
              this.uploadProgress = (processedItems / totalItems) * 100;
            } catch (error) {
              console.error(`移动 ${item.key} 失败:`, error);
            }
          }
          
          const targetFolderPath = targetBasePath.slice(0, -1) + '_$folder$';
          await this.copyPaste(key, targetFolderPath);
          await axios.delete(`/api/write/items/${key}`);
          
          this.uploadProgress = null;
        } else {
          const targetFilePath = normalizedPath + finalFileName;
          await this.copyPaste(key, targetFilePath);
          await axios.delete(`/api/write/items/${key}`);
        }
        
        this.fetchFiles();
      } catch (error) {
        console.error('移动失败:', error);
        alert('移动失败,请检查目标路径是否正确');
      }
    },

    async getAllItems(prefix) {
      const items = [];
      let marker = null;
      
      do {
        const url = new URL(`/api/children/${prefix}`, window.location.origin);
        if (marker) {
          url.searchParams.set('marker', marker);
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        items.push(...data.value);
        
        for (const folder of data.folders) {
          items.push({
            key: folder + '_$folder$',
            size: 0,
            uploaded: new Date().toISOString(),
          });
          
          const subItems = await this.getAllItems(folder);
          items.push(...subItems);
        }
        
        marker = data.marker;
      } while (marker);
      
      return items;
    },

    uploadFiles(files) {
      if (this.cwd && !this.cwd.endsWith("/")) this.cwd += "/";

      const uploadTasks = Array.from(files).map((file) => ({
        basedir: this.cwd,
        file,
      }));
      this.uploadQueue.push(...uploadTasks);
      setTimeout(() => this.processUploadQueue());
    },
  },

  watch: {
    cwd: {
      handler() {
        this.fetchFiles();
        const url = new URL(window.location);
        if ((url.searchParams.get("p") || "") !== this.cwd) {
          this.cwd
            ? url.searchParams.set("p", this.cwd)
            : url.searchParams.delete("p");
          window.history.pushState(null, "", url.toString());
        }
        document.title = `${
          this.cwd.replace(/.*\/(?!$)|\//, "") || "/"
        } - 文件库`;
      },
      immediate: true,
    },
  },

  created() {
    window.addEventListener("popstate", (ev) => {
      const searchParams = new URL(window.location).searchParams;
      if (searchParams.get("p") !== this.cwd)
        this.cwd = searchParams.get("p") || "";
    });
  },

  components: {
    Dialog,
    Menu,
    MimeIcon,
    UploadPopup,
  },
};
</script>

<style>
.main {
  height: 100%;
}

.app-bar {
  position: sticky;
  top: 0;
  padding: 4px 6px;
  background-color: var(--bg-primary);
  display: flex;
  align-items: center;
  z-index: 10;
  border-bottom: 1px solid var(--border);
}

.menu-button {
  display: flex;
  position: relative;
  margin-left: 3px;
}

.menu-button > button {
  transition: all 0.2s ease;
  border-radius: 50%;
  padding: 3px;
}

.menu-button > button:hover {
  background-color: var(--bg-hover);
}

.menu {
  position: absolute;
  top: 100%;
  right: 0;
}

.item-action {
  margin-right: 4px;
  margin-left: auto;
  padding: 1px;
  border-radius: 50%;
  transition: background-color 0.12s ease;
  flex-shrink: 0;
}

.item-action:hover {
  background-color: var(--bg-active);
}

/* Text Editor */
.text-editor {
  width: 92vw;
  max-width: 800px;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.text-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  gap: 6px;
}

.text-editor-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.text-editor-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.text-editor-btn {
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
}

.text-editor-btn.save {
  background: var(--accent);
  color: white;
}

.text-editor-btn.save:hover {
  background: var(--accent-hover);
}

.text-editor-btn.cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.text-editor-btn.cancel:hover {
  background: var(--bg-hover);
}

.text-editor-content {
  flex: 1;
  width: 100%;
  padding: 8px 10px;
  border: none;
  outline: none;
  resize: none;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.5;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.text-editor-content::selection {
  background-color: var(--accent-glow);
}
</style>
