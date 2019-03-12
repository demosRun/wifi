"use strict";

// 对象合并方法
function assign(a, b) {
  var newObj = {};

  for (var key in a) {
    newObj[key] = a[key];
  }

  for (var key in b) {
    newObj[key] = b[key];
  }

  return newObj;
} // 运行页面所属的方法


function runPageFunction(pageName, entryDom) {
  // ozzx-name处理
  window.ozzx.domList = {};
  pgNameHandler(entryDom); // 判断页面是否有自己的方法

  var newPageFunction = window.ozzx.script[pageName];
  if (!newPageFunction) return; // console.log(newPageFunction)
  // 如果有created方法则执行

  if (newPageFunction.created) {
    // 注入运行环境
    newPageFunction.created.apply(assign(newPageFunction, {
      $el: entryDom,
      data: newPageFunction.data,
      activePage: window.ozzx.activePage,
      domList: window.ozzx.domList
    }));
  } // 判断页面是否有下属模板,如果有运行所有模板的初始化方法


  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key];

    if (templateScript.created) {
      // 获取到当前配置页的DOM
      // 待修复,临时获取方式,这种方式获取到的dom不准确
      var domList = entryDom.getElementsByClassName('ox-' + key);

      if (domList.length !== 1) {
        console.error('我就说会有问题吧!');
        console.log(domList);
      } // 为模板注入运行环境


      templateScript.created.apply(assign(newPageFunction.template[key], {
        $el: domList[0].children[0],
        data: templateScript.data,
        activePage: window.ozzx.activePage,
        domList: window.ozzx.domList
      }));
    }
  }
} // ozzx-name处理


function pgNameHandler(dom) {
  // 遍历每一个DOM节点
  for (var i = 0; i < dom.children.length; i++) {
    var tempDom = dom.children[i]; // 判断是否存在@name属性

    var pgName = tempDom.attributes['@name'];

    if (pgName) {
      // console.log(pgName.textContent)
      // 隐藏元素
      tempDom.hide = function () {
        this.style.display = 'none';
      };

      window.ozzx.domList[pgName.textContent] = tempDom;
    } // 判断是否有点击事件


    var clickFunc = tempDom.attributes['@click'];

    if (clickFunc) {
      tempDom.onclick = function (event) {
        var clickFor = this.attributes['@click'].textContent; // 判断页面是否有自己的方法

        var newPageFunction = window.ozzx.script[window.ozzx.activePage]; // console.log(this.attributes)
        // 判断是否为模板

        var templateName = this.attributes['template']; // console.log(templateName)

        if (templateName) {
          newPageFunction = newPageFunction.template[templateName.textContent];
        } // console.log(newPageFunction)
        // 取出参数


        var parameterArr = [];
        var parameterList = clickFor.match(/[^\(\)]+(?=\))/g);

        if (parameterList && parameterList.length > 0) {
          // 参数列表
          parameterArr = parameterList[0].split(','); // 进一步处理参数

          for (var i = 0; i < parameterArr.length; i++) {
            var parameterValue = parameterArr[i].replace(/(^\s*)|(\s*$)/g, ""); // console.log(parameterValue)
            // 判断参数是否为一个字符串

            if (parameterValue.charAt(0) === '"' && parameterValue.charAt(parameterValue.length - 1) === '"') {
              parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1);
            }

            if (parameterValue.charAt(0) === "'" && parameterValue.charAt(parameterValue.length - 1) === "'") {
              parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1);
            } // console.log(parameterArr[i])

          }

          clickFor = clickFor.replace('(' + parameterList + ')', '');
        } // console.log(newPageFunction)
        // 如果有方法,则运行它


        if (newPageFunction[clickFor]) {
          // 绑定window.ozzx对象
          // console.log(tempDom)
          // 待测试不知道这样合并会不会对其它地方造成影响
          newPageFunction.$el = this;
          newPageFunction.$event = event;
          newPageFunction.domList = window.ozzx.domList;
          newPageFunction[clickFor].apply(newPageFunction, parameterArr);
        } else {
          // 如果没有此方法则弹出警告
          console.error("Can't find function: " + clickFor);
        }
      };
    } // 递归处理所有子Dom结点


    if (tempDom.children.length > 0) {
      pgNameHandler(tempDom);
    }
  }
} // 便捷获取被命名的dom元素


function $dom(domName) {
  return ozzx.domList[domName];
} // 跳转到指定页面


function $go(pageName, inAnimation, outAnimation) {
  window.location.href = "#" + pageName + "&in=" + inAnimation + "&out=" + outAnimation;
} // 获取URL #后面内容


function getarg(url) {
  var arg = url.split("#");
  return arg[1];
} // 页面资源加载完毕事件


window.onload = function () {
  // 取出URL地址判断当前所在页面
  var pageArg = getarg(window.location.href); // 从配置项中取出程序入口

  var page = pageArg ? pageArg.split('&')[0] : ozzx.entry;

  if (page) {
    var entryDom = document.getElementById('ox-' + page);

    if (entryDom) {
      // 显示主页面
      entryDom.style.display = 'block';
      window.ozzx.activePage = page; // 更改$data链接

      $data = ozzx.script[page].data;
      runPageFunction(page, entryDom);
    } else {
      console.error('入口文件设置错误,错误值为: ', entryDom);
    }
  } else {
    console.error('未设置程序入口!');
  }
}; // url发生改变事件


window.onhashchange = function (e) {
  var oldUrlParam = getarg(e.oldURL);
  var newUrlParam = getarg(e.newURL); // 如果没有跳转到任何页面则跳转到主页

  if (newUrlParam === undefined) {
    newUrlParam = ozzx.entry;
  } // 如果没有发生页面跳转则不需要进行操作
  // 切换页面特效


  switchPage(oldUrlParam, newUrlParam);
};

window.ozzx = {
  script: {
    "login": {
      "created": function created() {
        // 禁止页面拖动
        // document.body.ontouchmove=function(e){
        //   e.preventDefault();
        // }
        // 判断是否为授权
        var authorizeName = getQueryString(location.href, 'authorizeName');

        if (authorizeName) {
          $dom('authorize').innerText = authorizeName + '授权页面';
        }
      },
      "reset": function reset() {
        console.log($dom('userName'));
        $dom('userName').value = '';
        $dom('password').value = '';
      },
      "login": function login() {
        var userName = $dom('userName').value;
        var password = $dom('password').value;
        console.log('用户名:', userName);
        console.log('密码:', password);
        var authorize = getQueryString(location.href, 'authorize'); // 判断用户名或者密码是否为空

        if (userName && password) {
          if (authorize) {
            alert('这是一个授权页面,id为' + authorize);
          }

          $go('auth', 'moveToLeft', 'moveFromRight');
        } else {
          if (authorize) {
            alert('授权失败,id为' + authorize);
            window.location.href = "#alert&in=moveToLeft&out=moveFromRight&authorize=" + authorize;
          } else {
            $go('alert', 'moveToLeft', 'moveFromRight');
          }
        }
      }
    },
    "topBar": {},
    "auth": {
      "data": {
        "authList": [{
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }, {
          "id": 1,
          "name": "OA系统",
          "img": "./static/resource/oa.png"
        }]
      }
    },
    "alert": {
      "created": function created() {
        var authorize = getQueryString(location.href, 'authorize');

        if (authorize) {
          $dom('alertText').innerText = '授权失败, 请拨打电话3668联系管理员!';
        } else {
          $dom('alertText').innerText = '用户登陆失败, 请拨打电话3668联系管理员!';
        }
      }
    }
  },
  tool: {},
  entry: "login",
  state: {}
}; // 便捷的获取工具方法

var $tool = ozzx.tool;
var $data = {}; // 页面切换效果
// 获取URL参数

function getQueryString(newUrlParam, name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  var r = newUrlParam.match(reg);
  if (r != null) return unescape(r[2]);
  return null;
} // 无特效翻页


function dispalyEffect(oldDom, newDom) {
  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none';
  } // 查找页面跳转后的page


  newDom.style.display = 'block';
} // 切换页面动画


function animation(oldDom, newDom, animationIn, animationOut) {
  if (!oldDom) {
    console.error('旧页面不存在!');
  }

  oldDom.addEventListener("animationend", oldDomFun);
  newDom.addEventListener("animationend", newDomFun);
  oldDom.style.position = 'absolute';
  oldDom.style.overflow = 'hidden';
  newDom.style.display = 'block';
  newDom.style.position = 'absolute'; // document.body.style.overflow = 'hidden'

  animationIn.split(',').forEach(function (value) {
    console.log('add:' + value);
    oldDom.classList.add('ox-page-' + value);
    oldDom.classList.add('ozzx-animation');
  });
  animationOut.split(',').forEach(function (value) {
    console.log('add:' + value);
    newDom.classList.add('ox-page-' + value);
    oldDom.classList.add('ozzx-animation');
  }); // 旧DOM执行函数

  function oldDomFun() {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'; // console.log(oldDom)

    oldDom.style.position = ''; // 清除临时设置的class

    animationIn.split(',').forEach(function (value) {
      console.log('del:' + value);
      oldDom.classList.remove('ox-page-' + value);
      oldDom.classList.remove('ozzx-animation');
    }); // 移除监听

    oldDom.removeEventListener('animationend', oldDomFun, false);
  } // 新DOM执行函数


  function newDomFun() {
    // 清除临时设置的style
    newDom.style.position = '';
    animationOut.split(',').forEach(function (value) {
      console.log('del:' + value);
      newDom.classList.remove('ox-page-' + value);
      newDom.classList.remove('ozzx-animation');
    }); // 移除监听

    newDom.removeEventListener('animationend', newDomFun, false);
  }
} // 切换页面前的准备工作


function switchPage(oldUrlParam, newUrlParam) {
  var oldPage = oldUrlParam;
  var newPage = newUrlParam;
  var newPagParamList = newPage.split('&');
  if (newPage) newPage = newPagParamList[0]; // 查找页面跳转前的page页(dom节点)
  // console.log(oldUrlParam)
  // 如果源地址获取不到 那么一般是因为源页面为首页

  if (oldPage === undefined) {
    oldPage = ozzx.entry;
  } else {
    oldPage = oldPage.split('&')[0];
  }

  var oldDom = document.getElementById('ox-' + oldPage);
  var newDom = document.getElementById('ox-' + newPage);

  if (!newDom) {
    console.error('页面不存在!');
    return;
  } // 判断是否有动画效果


  if (newPagParamList.length > 1) {
    var animationIn = getQueryString(newUrlParam, 'in');
    var animationOut = getQueryString(newUrlParam, 'out'); // 如果没用动画参数则使用默认效果

    if (!animationIn || !animationOut) {
      dispalyEffect(oldDom, newDom);
      return;
    }

    animation(oldDom, newDom, animationIn, animationOut);
  } else {
    dispalyEffect(oldDom, newDom);
  }

  window.ozzx.activePage = newPage; // 更改$data链接

  $data = ozzx.script[newPage].data;
  runPageFunction(newPage, newDom);
}