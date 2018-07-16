export function getImageInWx (img, callback) {
  if (img.indexOf('//tmp') >-1 || (img.indexOf('https://') === -1 && img.indexOf('http://') === -1)){
    wx.getImageInfo({
      src: img,
      success: (info) => {
        callback({
          img: img,
          width: info.width,
          height: info.height
        })
      }
    })
  } else {
    wx.downloadFile({
      url: img,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.getImageInfo({
            src: res.tempFilePath,
            success: (info) => {
              callback({
                img: res.tempFilePath,
                width: info.width,
                height: info.height
              })
            }
          })
        }
      }
    })
  }
}

function getGlobal () {
  if (typeof global !== 'object' || !global || global.Math !== Math || global.Array !== Array) {
    if (typeof self !== 'undefined') {
      return self
    } else if (typeof window !== 'undefined') {
      return window
    } else if (typeof global !== 'undefined') {
      return global
    }
    return (function () {
      return this
    })()
  }
  return global
}

export function attributeCount(obj) {
    var count = 0;
    for(var i in obj) {
        if(obj.hasOwnProperty(i)) {  // 建议加上判断,如果没有扩展对象属性可以不加
            count++;
        }
    }
    return count;
}

export function aggregation (baseClass, ...mixins)  {
    class base extends baseClass {
        constructor (...args) {
            super(...args);
            mixins.forEach((mixin) => {
                copyProps(this,(new mixin));
            });
        }
    }
    let copyProps = (target, source) => {  // this function copies all properties and symbols, filtering out some special ones
        Object.getOwnPropertyNames(source)
            .concat(Object.getOwnPropertySymbols(source))
            .forEach((prop) => {
                if (!prop.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/))
                    Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
            })
    }
    mixins.forEach((mixin) => { // outside contructor() to allow aggregation(A,B,C).staticFunction() to be called etc.
        copyProps(base.prototype, mixin.prototype);
        copyProps(base, mixin);
    });
    return base;
}

const root = getGlobal()

export default{
  getImageInWx,
  attributeCount,
  aggregation,
  root,
  isWeapp: typeof wx !== 'undefined' && !wx.createCanvas,
  isWegame: typeof wx !== 'undefined' && wx.createCanvas
}
