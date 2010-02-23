jsio('from common.javascript import Singleton, Publisher, bind')
jsio('import common.Item')
jsio('import common.Publisher')

exports = Singleton(common.Publisher, function(supr) {
	
	this.init = function() {
		supr(this, 'init')
		this._items = {}
	}
	
	this.loadItemSnapshot = function(snapshot, callback) {
		logger.log('Loading snapshot', snapshot._id, snapshot)
		var item = this.getItem(snapshot._id)
		item.setSnapshot(snapshot)
	}
	
	this.getItem = function(id) {
		if (this._items[id]) { return this._items[id] }
		logger.log("Create item", id)
		this._items[id] = new common.Item(this, id)
		this._publish('ItemCreated', this._items[id])
		return this._items[id]
	}

	this.hasItem = function(id) {
		return !!this._items[id]
	}
	
})
