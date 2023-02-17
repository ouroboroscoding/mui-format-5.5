/**
 * Shared
 *
 * Classes and methods for shared functionality in components
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding
 * @created 2022-03-19
 */

// Ouroboros
import { rest } from '@ouroboros/body';
import events from '@ouroboros/events';

/**
 * Error Tree
 *
 * Converts array of rest field errors into a tree
 *
 * @name errorTree
 * @access public
 * @param {string[][]} errors The list of errors
 * @returns {object}
 */
export function errorTree(errors) {

	// Init the return
	let oRet = {}

	// Go through each error
	for(let i = 0; i < errors.length; ++i) {

		// If the error field has a period
		if(errors[i][0].includes('.')) {

			// Split it
			let lField = errors[i][0].split(/\.(.*)/)

			// If we don't have the field already
			if(!oRet[lField[0]]) {
				oRet[lField[0]] = []
			}

			// Add the rest
			oRet[lField[0]].push([lField[1], errors[i][1]]);
		}

		// Else it's a flat field
		else {
			if(errors[i][1] === 'is not a string') {
				errors[i][1] = 'missing';
			} else if(errors[i][1] === 'failed regex (custom)') {
				errors[i][1] = 'invalid';
			}
			oRet[errors[i][0]] = errors[i][1];
		}
	}

	// Go through all the errors we found
	for(let k in oRet) {

		// If we find an array
		if(Array.isArray(oRet[k])) {

			// Recurse
			oRet[k] = errorTree(oRet[k]);
		}
	}

	// Return the Tree
	return oRet;
}

/**
 * Select Base
 *
 * The base class for dynamic Select types
 *
 * @name SelectBase
 * @access public
 */
export class SelectBase {

	_CLONE_SKIP_ = true;

	/**
	 * Constructor
	 *
	 * Initialises the base class
	 *
	 * @name SelectBase
	 * @access private
	 * @returns {SelectBase}
	 */
	constructor() {

		// Init the list of callbacks
		this._callbacks = [];
	}

	/**
	 * Notify
	 *
	 * Sends the data to all callbacks
	 *
	 * @name notify
	 * @access public
	 * @param {string[][]} data The data to send to all callbacks
	 */
	notify(data) {

		// Go through each callback and notify of the data change
		for(let f of this._callbacks) {
			f(data);
		}
	}

	/**
	 * Track
	 *
	 * Stores a callback function to be called whenever the select data needs
	 * to change
	 *
	 * @name track
	 * @access public
	 * @param {Function} callback The function to call when data changes
	 * @param {boolean} remove Set to false to remove the callback
	 */
	track(callback, remove=false) {

		// If we are removing a callback
		if(remove) {

			// Try to find the callback in the list
			let i = this._callbacks.indexOf(callback);

			// If we get an index, delete the callback
			if(i > -1) {
				this._callbacks.splice(i, 1);
			}
		}

		// If we are adding a new callback
		else {

			// Add it to the list
			this._callbacks.push(callback);
		}
	}
}

/**
 * Select Custom
 *
 * Class to allow for dynamic data in selects/dropdowns set whenever the user
 * decides
 *
 * @name SelectCustom
 * @access public
 * @extends SelectBase
 */
export class SelectCustom extends SelectBase {

	/**
	 * Select Custom
	 *
	 * Creates an instance of the class with default data
	 *
	 * @name SelectCustom
	 * @access public
	 * @param Array[] data Default data
	 * @returns {SelectCustom}
	 */
	constructor(data=[]) {

		// Call the base class constructor
		super();

		// Init the data
		this._data = data;
	}

	/**
	 * Set
	 *
	 * Called to set the new array of value and name
	 *
	 * @name set
	 * @access public
	 * @param {string[][]} data An array of arrays with the first element being
	 * 							the key	and the second element being the name
	 */
	set(data) {

		// Store the new data
		this._data = data;

		// Notify
		this.notify(this._data);
	}

	/**
	 * Track
	 *
	 * Stores a callback function to be called whenever the key changes
	 *
	 * @name track
	 * @access public
	 * @param {Function} callback The function to call when data changes
	 * @param {boolean} remove Set to false to remove the callback
	 */
	track(callback, remove=false) {

		// Call the base class track
		super.track(callback, remove);

		// If we are not removing the callbacl
		if(!remove) {

			// Return the current data
			return this._data;
		}
	}
}

/**
 * Select Hash
 *
 * Class to allow for dynamic data based on a hash of key to list of key/value
 * pairs
 *
 * @name SelectHash
 * @access public
 * @extends SelectBase
 */
export class SelectHash extends SelectBase {

	/**
	 * SelectHash
	 *
	 * Constructor
	 *
	 * @name SelectHash
	 * @access public
	 * @param {Object} hash The key to key/value pairs
	 * @param {string|null} initial_key Optional, the initial key to use,
	 * 									defaults to the first key in the hash
	 * @returns {SelectHash}
	 */
	constructor(hash, initial_key=null) {

		// Call base class constructor
		super();

		// Store the hash
		this._hash = hash;
		this._key = initial_key;

		// If we have no key
		if(this._key === null) {
			this._key = '';
		}
	}

	/**
	 * Key
	 *
	 * Sets/Gets the new key
	 *
	 * @name key
	 * @access public
	 * @param {string} key Optional, Use to set value, else get
	 * @returns {void|string}
	 */
	key(key) {

		// If we got a key
		if(key !== undefined) {

			// Store the new key
			this._key = key;

			// Notify
			this.notify(this._key in this._hash ? this._hash[this._key] : []);
		}

		// Else, return the current key
		else {
			return this._key;
		}
	}

	/**
	 * Track
	 *
	 * Stores a callback function to be called whenever the key changes
	 *
	 * @name track
	 * @access public
	 * @param {Function} callback The function to call when data changes
	 * @param {boolean} remove Set to false to remove the callback
	 */
	track(callback, remove=false) {

		// Call the base class track
		super.track(callback, remove);

		// If we are not removing the callbacl
		if(!remove) {

			// Return the current data
			return this._key in this._hash ? this._hash[this._key] : [];
		}
	}
}

/**
 * Select Rest
 *
 * Class to allow for dynamic data in selects/dropdowns built from rest requests
 *
 * @name SelectRest
 * @access public
 * @extends SelectBase
 */
export class SelectRest extends SelectBase {

	/**
	 * Select Rest
	 *
	 * Creates an instance of the class with default data
	 *
	 * @name SelectRest
	 * @access public
	 * @param {string} service Name of the service to fetch data from
	 * @param {string} noun Noun of the service
	 * @param {string[]|Function} fields A list of [key, value], or a function
	 * 							that return [key, value] for the element passed
	 * 							to it
	 * @param {string} value The value used to make the key/value pairs
	 * @param {string[][]} data Default data
	 * @returns {SelectRest}
	 */
	constructor(service, noun, fields=['_id', 'name'], data=[]) {

		// Call the base class constructor
		super();

		// Store the service and noun
		this._service = service;
		this._noun = noun;
		this._fields = fields;

		// Init the data
		this._data = data;
		this._fetched = false;
	}

	/**
	 * Track
	 *
	 * Stores a callback function to be called whenever the data changes
	 *
	 * @name track
	 * @access public
	 * @param {Function} callback The function to call when data changes
	 * @param {boolean} remove Set to false to remove the callback
	 */
	track(callback, remove=false) {

		// Call the base class track
		super.track(callback, remove);

		// If we are not removing the callback
		if(!remove) {

			// If we don't have the data yet
			if(!this._fetched) {
				this._fetched = true;
				this._fetch();
			}

			// Return the current data
			return this._data;
		}
	}

	/**
	 * Fetch
	 *
	 * Retrieve the data from the service so we can store it and send it off
	 * to anyone tracking this instance
	 *
	 * @name _fetch
	 * @access private
	 */
	_fetch() {

		// Make the request to the server
		rest.read(this._service, this._noun, {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				events.trigger('error', res.error);
			}
			if(res.warning) {
				events.trigger('warning', res.warning);
			}

			// If we got data
			if(res.data) {

				// Generate the name/value pairs
				this._data = [];
				for(let o of res.data) {
					if(typeof this._fields === 'function') {
						this._data.push(this._fields(o));
					} else {
						this._data.push([o[this._fields[0]], o[this._fields[1]]]);
					}
				}

				// Notify the trackers
				this.notify(this._data);
			}
		});
	}
}

// Default export
const Shared = {
	errorTree: errorTree,
	SelectBase: SelectBase,
	SelectCustom: SelectCustom,
	SelectHash: SelectHash,
	SelectRest: SelectRest
};
export default Shared;
