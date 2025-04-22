// 创建右下角浮动图标
function createFloatingIcon() {
  // 创建浮动图标容器
  const floatingIcon = document.createElement('div');
  floatingIcon.id = 'url-viewer-floating-icon';
  floatingIcon.className = 'url-viewer-floating-icon';

  // 创建图标
  const iconImg = document.createElement('img');
  iconImg.src = chrome.runtime.getURL('images/icon48.png');
  iconImg.alt = 'URL窗口:';
  floatingIcon.appendChild(iconImg);

  // 添加到页面
  document.body.appendChild(floatingIcon);

  // 使图标可拖动
  makeDraggable(floatingIcon);

  console.log('createFloatingIcon', 1234566);
}

// 创建URL查看器容器
function createUrlViewerContainer() {
  const container = document.createElement('div');
  container.id = 'url-viewer-container';
  container.className = 'url-viewer-container';
  container.style.display = 'none';

  // 创建顶部栏
  const header = document.createElement('div');
  header.className = 'url-viewer-header';

  // // 标题
  const title = document.createElement('div');
  title.textContent = 'URL窗口：';
  title.className = 'url-viewer-title';
  header.appendChild(title);

  // 创建URL选择器
  const urlSelectorContainer = document.createElement('div');
  urlSelectorContainer.className = 'url-viewer-selector-container';

  const urlSelector = document.createElement('select');
  urlSelector.id = 'url-viewer-selector';
  urlSelector.className = 'url-viewer-selector';
  urlSelectorContainer.appendChild(urlSelector);

  // 添加新窗口打开按钮
  const openInNewWindowBtn = document.createElement('button');
  openInNewWindowBtn.textContent = '浏览器打开';
  openInNewWindowBtn.className = 'url-viewer-new-window-btn';
  openInNewWindowBtn.addEventListener('click', function() {
    const selectedIndex = parseInt(urlSelector.value);
    chrome.storage.sync.get('savedUrl', function(data) {
      if (data.savedUrl) {
        window.open(data.savedUrl, '_blank');
      }
    });
  });
  urlSelectorContainer.appendChild(openInNewWindowBtn);

  // 为选择器添加变化事件
  urlSelector.addEventListener('change', function () {
    const selectedIndex = parseInt(this.value);
    chrome.storage.sync.get('urlArray', function (data) {
      if (data.urlArray && Array.isArray(data.urlArray) && data.urlArray[selectedIndex]) {
        const iframe = document.getElementById('url-viewer-iframe');
        iframe.src = data.urlArray[selectedIndex].url;

        // 保存选中的索引和URL
        chrome.storage.sync.set({
          'selectedUrlIndex': selectedIndex,
          'savedName': data.urlArray[selectedIndex].name,
          'savedUrl': data.urlArray[selectedIndex].url
        });
      }
    });
  });

  // 加载URL数组并填充选择器
  updateUrlSelector(urlSelector);

  header.appendChild(urlSelectorContainer);

  // 关闭按钮
  const closeBtn = document.createElement('div');
  closeBtn.textContent = '×';
  closeBtn.className = 'url-viewer-close-btn';
  closeBtn.addEventListener('click', function () {
    container.style.display = 'none';
  });
  header.appendChild(closeBtn);

  container.appendChild(header);

  // 创建内容区
  const content = document.createElement('div');
  content.className = 'url-viewer-content';


  // iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'url-viewer-iframe';
  iframe.className = 'url-viewer-iframe';
  iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
  iframe.style.flex = '1';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.allow = 'fullscreen';
  content.appendChild(iframe);

  container.appendChild(content);

  // 添加到页面
  document.body.appendChild(container);

  // 加载保存的URL
  chrome.storage.sync.get(['savedUrl', 'savedName', 'selectedUrlIndex'], function (data) {
    if (data.savedUrl) {
      iframe.src = data.savedUrl;
    } else {
      // 如果没有保存的URL，可以设置一个默认页面
      iframe.src = 'about:blank';
    }
    // 设置选择器的选中项
    if (data.selectedUrlIndex !== undefined && urlSelector.options.length > data.selectedUrlIndex) {
      urlSelector.selectedIndex = data.selectedUrlIndex;
    }
  });

  return container;
}

// 更新URL选择器
function updateUrlSelector(selector) {
  chrome.storage.sync.get(['urlArray', 'selectedUrlIndex'], function (data) {
    // 清空选择器
    selector.innerHTML = '';

    if (!data.urlArray || !Array.isArray(data.urlArray) || data.urlArray.length === 0) {
      // 如果没有URL，添加默认选项
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '无保存的URL';
      selector.appendChild(option);
      return;
    }

    // 设置选中索引
    const selectedIndex = data.selectedUrlIndex !== undefined ? data.selectedUrlIndex : 0;

    // 添加选项
    data.urlArray.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = item.name;
      if (index === selectedIndex) {
        option.selected = true;
      }
      selector.appendChild(option);
    });
  });
}


// 切换URL查看器显示状态
function toggleUrlViewer() {
  let container = document.getElementById('url-viewer-container');

  if (!container) {
    container = createUrlViewerContainer();
  }

  if (container.style.display === 'none') {
    container.style.display = 'block';
    // 每次显示时更新选择器
    const urlSelector = document.getElementById('url-viewer-selector');
    if (urlSelector) {
      updateUrlSelector(urlSelector);
    }
  } else {
    container.style.display = 'none';
  }
}

// 验证URL格式
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}


// 在页面加载完成后创建浮动图标
window.addEventListener('load', function () {
  createFloatingIcon();
  console.log("URL查看器内容脚本已加载，版本:", Date.now());
});


// 添加拖动功能到浮动图标
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;
  
  element.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    e = e || window.event;
    
    // 记录鼠标按下时间，用于区分点击和拖动
    const startTime = new Date().getTime();
    const startX = e.clientX;
    const startY = e.clientY;
    
    // 获取鼠标初始位置
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // 添加鼠标移动和释放事件
    document.addEventListener('mousemove', elementDrag);
    document.addEventListener('mouseup', function(e) {
      const endTime = new Date().getTime();
      const endX = e.clientX;
      const endY = e.clientY;
      
      // 计算移动距离
      const moveDistance = Math.sqrt(
        Math.pow(endX - startX, 2) + 
        Math.pow(endY - startY, 2)
      );
      
      // 如果移动距离小且时间短，视为点击而非拖动
      if (moveDistance < 5 && endTime - startTime < 200 && !isDragging) {
        toggleUrlViewer();
      }
      
      closeDragElement();
    });
    
    e.preventDefault();
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    // 标记正在拖动
    isDragging = true;
    
    // 计算新位置
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    // 获取窗口大小和边界
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 获取元素当前位置
    let newTop, newLeft;
    
    // 检查元素是否已设置了top/left值
    if (element.style.top) {
      newTop = parseInt(element.style.top) - pos2;
    } else {
      // 如果元素使用bottom定位，则需要计算top值
      newTop = windowHeight - element.offsetHeight - parseInt(getComputedStyle(element).bottom) - pos2;
    }
    
    if (element.style.left) {
      newLeft = parseInt(element.style.left) - pos1;
    } else {
      // 如果元素使用right定位，则需要计算left值
      newLeft = windowWidth - element.offsetWidth - parseInt(getComputedStyle(element).right) - pos1;
    }

    // 设置边界限制
    const margin = 10;
    newTop = Math.max(margin, Math.min(windowHeight - element.offsetHeight - margin, newTop));
    newLeft = Math.max(margin, Math.min(windowWidth - element.offsetWidth - margin, newLeft));

    // 设置元素的新位置
    element.style.top = newTop + "px";
    element.style.left = newLeft + "px";
    element.style.right = "auto";
    element.style.bottom = "auto";
  }

  function closeDragElement() {
    // 停止移动
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
    
    // 延迟重置拖动状态，以便点击事件能正确处理
    setTimeout(() => {
      isDragging = false;
    }, 100);
  }

}
