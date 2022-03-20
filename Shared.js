/**
 * Shared
 *
 * Classes and methods for shared functionality in components
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding
 * @created 2022-03-19
 */

// Communications
import Rest from 'shared/communication/rest';

// Generic
import Events from 'shared/generic/events';

/**
 * Select Data
 *
 * Class to allow for dynamic data in selects/dropdowns built from definition
 * data
 */
export class SelectData {

	/**
	 * Select Data
	 *
	 * Creates an instance of the class with default data
	 *
	 * @name SelectData
	 * @access public
	 * @param String service Name of the service to fetch data from
	 * @param String noun Noun of the service
	 * @param String key The key used to make the key/value pairs
	 * @param String value The value used to make the key/value pairs
	 * @param Array[] data Default data
	 * @return SelectData
	 */
	constructor(service, noun, key='_id', value='name', data=[]) {

		// Store the service and noune
		this._service = service;
		this._noun = noun;
		this._key = key;
		this._value = value;

		// Init the data
		this._data = data;
		this._fetched = false;

		// Init the list of callbacks
		this._callbacks = [];
	}

	/**
	 * Track
	 *
	 * Stores a callback function to be called whenever the data changes
	 *
	 * @name track
	 * @access public
	 * @param Function callback The function to call when data changes
	 * @param bool remove Set to false to remove the callback
	 * @return void
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
	 * @return {[type]} [description]
	 */
	_fetch() {

		// Make the request to the server
		Rest.read(this._service, this._noun, {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', res.error);
			}
			if(res.warning) {
				Events.trigger('warning', res.warning);
			}

			// If we got data
			if(res.data) {

				// Generate the name/value pairs
				this._data = [];
				for(let o of res.data) {
					this._data.push([o[this._key], o[this._value]]);
				}

				// Go through each callback and notify of the data change
				for(let f of this._callbacks) {
					f(this._data);
				}
			}
		})
	}
}

// Default export
const Shared = {
	SelectData: SelectData
};
export default Shared;
