document.addEventListener('DOMContentLoaded', function () {
  const addInput = document.getElementById('addInput');
  const addButton = document.getElementById('addButton');
  const removeButton = document.getElementById('removeButton');
  const urlSelector = document.getElementById('urlSelector');
  const currentUrl = document.getElementById('currentUrl');
  const viewButton = document.getElementById('viewButton');
  const viewIframe = document.getElementById('viewIframe');

  // 加载保存的URL数组
  chrome.storage.sync.get(['urlArray', 'selectedUrlIndex'], function (data) {
    if (data.urlArray && Array.isArray(data.urlArray) && data.urlArray.length > 0) {
      updateUrlSelector(data.urlArray, data.selectedUrlIndex);
    }
  });

  // 导出URL按钮
  getButton.addEventListener('click', function () {
    chrome.storage.sync.get(['urlArray'], function (data) {
      if (data.urlArray && Array.isArray(data.urlArray)) {
        const urlString = data.urlArray.map(item => `${item.name}__${item.url}`).join(',');
        addInput.value = urlString;
        console.log("导出URL:", urlString);
      }
    });
  });

  // 添加URL按钮
  addButton.addEventListener('click', function () {
    const inputText = addInput.value.trim();
    if (!inputText) {
      alert('请输入URL信息');
      return;
    }

    const urls = inputText.split(',');
    chrome.storage.sync.get(['urlArray'], function (data) {
      let urlArray = data.urlArray || [];
      urls.forEach(url1 => {
        const parts = url1.trim().split('__');
        if (parts.length !== 2) {
          alert('请输入正确的格式：名称__URL，例如：翻译__https://www.example.com');
          return;
        }

        const name = parts[0].trim();
        const url = parts[1].trim();

        // 验证URL格式
        if (!isValidUrl(url)) {
          alert('请输入有效的URL (例如: 翻译__https://www.example.com)');
          return;
        }
        // 检查是否已存在相同名称的URL
        const existingIndex = urlArray.findIndex(item => item.name === name);

        if (existingIndex !== -1) {
          // 更新现有URL
          urlArray[existingIndex] = { name, url };
        } else {
          // 添加新URL
          urlArray.push({ name, url });
        }
      });

      // 保存更新后的数组
      chrome.storage.sync.set({ 'urlArray': urlArray }, function () {
        // 更新选择器
        updateUrlSelector(urlArray);
        alert('URL已添加!');
      });
    })
  });

  // 移除URL按钮
  removeButton.addEventListener('click', function () {
    const selectedIndex = urlSelector.value;
    if (selectedIndex === '') {
      alert('请先选择要移除的URL');
      return;
    }

    chrome.storage.sync.get(['urlArray'], function (data) {
      if (data.urlArray && Array.isArray(data.urlArray)) {
        // 移除选中的URL
        data.urlArray.splice(selectedIndex, 1);

        // 如果数组为空，清除选中索引
        const selectedUrlIndex = data.urlArray.length > 0 ? 0 : null;
        let savedUrl = null;
        if (selectedUrlIndex != null) {
          savedUrl = data.urlArray[selectedUrlIndex].url;
        }

        // 保存更新后的数组
        chrome.storage.sync.set({
          'urlArray': data.urlArray,
          'selectedUrlIndex': selectedUrlIndex,
          'savedUrl': savedUrl
        }, function () {
          // 更新选择器
          updateUrlSelector(data.urlArray, selectedUrlIndex);
          alert('URL已移除！');
        });
      }
    });
  });

  // 查看按钮
  viewButton.addEventListener('click', function () {
    const selectedIndex = urlSelector.value;
    if (selectedIndex === '') {
      alert('请先选择要查看的URL');
      return;
    }

    chrome.storage.sync.get('urlArray', function (data) {
      if (data.urlArray && Array.isArray(data.urlArray) && data.urlArray[selectedIndex]) {
        viewIframe.src = data.urlArray[selectedIndex].url;
      }
    });
  });

  // 更新URL选择器
  function updateUrlSelector(urlArray, selectedIndex = 0) {
    // 清空选择器
    urlSelector.innerHTML = '';

    if (urlArray.length === 0) {
      // 如果没有URL，显示提示
      currentUrl.textContent = '当前未选择URL';
      return;
    }

    // 添加选项
    urlArray.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${item.name}: ${item.url}`;
      if (index === selectedIndex) {
        option.selected = true;
      }
      urlSelector.appendChild(option);
    });

    // 更新当前URL显示
    currentUrl.textContent = `当前选中: ${urlArray[selectedIndex].name} - ${urlArray[selectedIndex].url}`;
    // 保存选中的索引 和 url
    chrome.storage.sync.set({ 'selectedUrlIndex': selectedIndex });
    chrome.storage.sync.set({ 'savedName': urlArray[selectedIndex].name });
    chrome.storage.sync.set({ 'savedUrl': urlArray[selectedIndex].url });
  }

  // 选择器变化事件
  urlSelector.addEventListener('change', function () {
    const selectedIndex = parseInt(this.value);
    chrome.storage.sync.get('urlArray', function (data) {
      if (data.urlArray && Array.isArray(data.urlArray)) {
        updateUrlSelector(data.urlArray, selectedIndex);
      }
    });
  });

  // 验证URL格式
  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
}); 