jsio('from common.javascript import Singleton, bind');
jsio('import browser.dimensions')
jsio('import browser.dom')
jsio('import browser.events as events')
jsio('import browser.caret')
jsio('import browser.keystrokeManager');

exports = Singleton(function(){
	
	var PADDING = 4;

	this.init = function() {
		this._input = document.createElement('textarea');
		this._input.style.position = 'absolute';
		this._input.style.padding = '1px 0 0 3px'
		events.add(this._input, 'blur', bind(this, 'hide'))
	}
	
	this.setValue = function(value) {
		this._input.value = value;
	}
	
	this.showAt = function(dom, onMutationCallback, onHideCallback) {
		this._targetDom = dom;
		this._onMutationCallback = onMutationCallback;
		this._onHideCallback = onHideCallback;
		
		this._input.style.fontSize = browser.dom.getStyle(dom, 'font-size');
		this._input.style.fontFamily = browser.dom.getStyle(dom, 'font-family');
		
		this._resize();
		
		if (!this._input.parentNode) { 
			document.body.appendChild(this._input); 
			this._input.focus();
		}
		
		this._keystrokeHandler = browser.keystrokeManager.requestFocus(bind(this, 'onKeyPress'), true);
	}
	
	this._resize = function() {
		var dimensions = browser.dimensions.getDimensions(this._targetDom);
		
		var inputOffset = 0; // to make the text inside the input line up with text it overlays
		this._input.style.top = dimensions.top - PADDING - inputOffset + 'px';
		this._input.style.left = dimensions.left - PADDING + 'px';
		this._input.style.width = dimensions.width + PADDING * 2 + 30 + 'px';
		this._input.style.height = dimensions.height + PADDING * 2 + 'px';
	}
	
	this.hide = function() {
		browser.keystrokeManager.release(this._keystrokeHandler);
		document.body.removeChild(this._input);
		if (this._onHideCallback) { this._onHideCallback(); }
	}
	
	this.onKeyPress = function(e) {
		// TODO: Deal with pasting
		if (e.metaKey && e.keyCode != events.keyCodes['enter']) { return; }
		
		var position = browser.caret.getPosition(this._input);
		var selectionLength = position.end - position.start;
		var mutation = { position: position.caret - selectionLength };
		
		if (e.keyCode == events.keyCodes || (e.keyCode == events.keyCodes['enter'] && !e.metaKey)) {
			this._input.blur();
			events.cancel(e);
			return;
		} else if (e.keyCode == events.keyCodes['backspace']) {
			if (selectionLength) {
				mutation.deletion = selectionLength;
			} else {
				mutation.position -= 1;
				mutation.deletion = 1;
			}
		} else if (e.keyCode == events.keyCodes['enter'] && e.metaKey) {
			mutation.addition = "\n";
			if (selectionLength) {
				mutation.deletion = selectionLength;
			}
			
			void(bind(this, function(){
				// with the metaKey down, the return does not make it into the input field
				// This is a ugly-ass way to do it, and would be much nicer by detecting if shift is
				// pressed down with the enter and use that instead of the metaKey to insert a newline 
				jsio('import common.Item');
				this._input.value = common.Item.prototype._applyMutationToValue(mutation, this._input.value);
			}))();
			
		} else if (e.charCode) {
			mutation.addition = String.fromCharCode(e.charCode);
			if (selectionLength) {
				mutation.deletion = selectionLength;
			}
		}
		
		// Don't publish no op mutations
		if (!mutation.deletion && !mutation.addition) { return; }
		
		setTimeout(bind(this, function() {
			this._resize();
			this._onMutationCallback(mutation, this._input.value);
		}), 0);
	}
})