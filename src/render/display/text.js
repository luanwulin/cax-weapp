import DisplayObject from './display-object'
import util from '../../common/util'

let measureCtx

if (util.isWeapp) {
    measureCtx = wx.createCanvasContext('measure0')
} else if (typeof document !== 'undefined') {
    measureCtx = document.createElement('canvas').getContext('2d')
}

class Text extends DisplayObject {
    constructor(text, option) {
        super()

        this.text = text
        option = option || {}
        this.font = option.font || '10px sans-serif'
        this.color = option.color || 'black'

        this.baseline = option.baseline || 'top'
    }

    getWidth() {
        if (!measureCtx) {
            if (util.isWegame) {
                measureCtx = wx.createCanvas().getContext('2d')
            }
        }

        if (this.font) {
            measureCtx.font = this.font
        }

        if (this.width) {
            return this.width
        } else {
            return this.width = measureCtx.measureText(this.text).width
        }
    }

    getFontWidth() {
        if (this.fontWidth) {
            return this.fontWidth
        } else {
            return this.fontWidth = parseInt(this.font) * this.text.length
        }
    }
}

export default Text
