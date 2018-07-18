import Group from '../display/group.js'
import Graphics from '../display/graphics.js'
import Render from './render.js'
import Sprite from '../display/sprite.js'
import Bitmap from '../display/bitmap.js'
import Text from '../display/text.js'
import { filter } from '../filter/index.js'

function loopPromise(array, callback) {
  return array.reduce((p, cur) =>
    p.then(_ => new Promise((resolve) => {
        const status = callback(cur, _);
        if(status && status instanceof Promise){
            status.then((res) => {
                resolve(res);
            })
        }else{
            resolve(status)
        }
      }
    ))
    , Promise.resolve());
}
class CanvasRender extends Render {
  constructor (canvasOrContext, width, height) {
    super()
    if (arguments.length === 3) {
      this.ctx = canvasOrContext
      this.width = width
      this.height = height
    } else {
      this.ctx = canvasOrContext.getContext('2d')
      this.width = canvasOrContext.width
      this.height = canvasOrContext.height
    }
  }

  clear (ctx, width, height) {
    //restore cache cavans transform
    ctx.restore()

    ctx.clearRect(0, 0, width, height)
  }

  render (ctx, o, cacheRender) {
    let mtx = o._matrix
      let _self = this;
    if(o.children){
      let list = o.children.slice(0),
          l = list.length
      return loopPromise(list, function (child) {
        mtx.initialize(1, 0, 0, 1, 0, 0)
        mtx.appendTransform(o.x , o.y , o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.originX, o.originY)
        // if (!this.checkBoundEvent(child)) continue
        ctx.save()
        let status = _self._render(ctx, child, cacheRender?null:mtx, cacheRender)
        if(status && status instanceof Promise){
          return status.then(()=>{
              ctx.restore()
          })
        }else{
          return Promise.resolve(()=>{
              ctx.restore()
          })
        }
      })
    } else {
        return this._render(ctx, o, mtx,cacheRender)
    }
  }

  _render (ctx, o, mtx, cacheRender) {
    if (!o.isVisible()) return
    const _self = this;

    if (mtx && !o.fixed) {
      o._matrix.initialize(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty)
    } else {
      o._matrix.initialize(1, 0, 0, 1, 0, 0)
    }
    mtx = o._matrix

    if(!cacheRender){
      mtx.appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.originX, o.originY)
    }
    const ocg = o.clipGraphics
    if (ocg) {
      ctx.beginPath()
      ocg._matrix.copy(mtx)
      ocg._matrix.appendTransform(ocg.x, ocg.y, ocg.scaleX, ocg.scaleY, ocg.rotation, ocg.skewX, ocg.skewY, ocg.originX, ocg.originY)
      ctx.setTransform(ocg._matrix.a, ocg._matrix.b, ocg._matrix.c, ocg._matrix.d, ocg._matrix.tx, ocg._matrix.ty)
      ocg.render(ctx)
      ctx.clip(o.clipRuleNonzero ? 'nonzero' : 'evenodd')
    }

    o.complexCompositeOperation = ctx.globalCompositeOperation = this.getCompositeOperation(o)
    o.complexAlpha = ctx.globalAlpha = this.getAlpha(o, 1)
    if(!cacheRender){
      ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty)
    }
    if (o._readyToCache) {
      o._readyToCache = false
      o.cacheCtx.setTransform(o._cacheData.scale, 0, 0, o._cacheData.scale, o._cacheData.x * -1, o._cacheData.y * -1)
      this.render(o.cacheCtx, o, true)
      //debug cacheCanvas
      //document.body.appendChild(o.cacheCanvas)
      if (o._readyToFilter) {
        o.cacheCtx.putImageData(filter(o.cacheCtx.getImageData(0, 0, o.cacheCanvas.width, o.cacheCanvas.height), o._filterName), 0, 0)
        this._readyToFilter = false
      }

      ctx.drawImage(o.cacheCanvas, o._cacheData.x, o._cacheData.y)
    } else if (o.cacheCanvas&&!cacheRender) {
      ctx.drawImage(o.cacheCanvas, o._cacheData.x, o._cacheData.y)
    } else if (o instanceof Group) {
      let list = o.children.slice(0),
        l = list.length
        return loopPromise(list, function (child) {
          ctx.save()
          let status = _self._render(ctx, child, mtx)
          if(status && status instanceof Promise){
            return status.then(()=>{
                ctx.restore()
            })
          }else{
            ctx.restore()
          }
        })
    } else if (o instanceof Graphics) {
      o.render(ctx)
    } else if (o instanceof Sprite && o.rect) {
      o.updateFrame()
      let rect = o.rect
      ctx.drawImage(o.img, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3])
    } else if (o instanceof Bitmap) {
      if(Bitmap.loading.hasOwnProperty(o.img) && Bitmap.loading[o.img] !== true){
         return Bitmap.loading[o.img].then(()=>{
             let bRect = o.rect
             ctx.drawImage(o.img, bRect[0], bRect[1], bRect[2], bRect[3], 0, 0, bRect[2], bRect[3])
         })
      } else if (o.rect) {
          let bRect = o.rect
          ctx.drawImage(o.img, bRect[0], bRect[1], bRect[2], bRect[3], 0, 0, bRect[2], bRect[3])
      }
    } else if (o instanceof Text) {
      ctx.font = o.font
      ctx.fillStyle = o.color
      ctx.textBaseline = o.baseline
      ctx.fillText(o.text, 0, 0)
    }
  }



  getCompositeOperation(o) {
    if (o.compositeOperation) return o.compositeOperation
    if (o.parent) return this.getCompositeOperation(o.parent)
  }

  getAlpha(o, alpha) {
    var result = o.alpha * alpha
    if (o.parent) {
      return this.getAlpha(o.parent, result)
    }
    return result
  }

}

export default CanvasRender
