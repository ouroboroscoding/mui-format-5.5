/**
 * Search
 *
 * Handles generating search
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2022-03-19
 */

// NPM modules
import FormatOC from 'format-oc';
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// Format
import Parent from './Parent';

// Shared Communications
import Rest from 'shared/communication/rest';

// Shared Generic
import Events from 'shared/generic/events';
import Hash from 'shared/generic/hash';
import { empty, isObject } from 'shared/generic/tools';

// Search
export default class Search extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Get the display options
		let oDisplay = props.tree.special('react') || {};

		// If there's no primary, assume '_id'
		if(!('primary' in oDisplay)) {
			oDisplay.primary = '_id';
		}

		// Set the initial state
		this.state = {
			name: props.tree._name
		}

		// Init the parent
		this.parent = null;

		// Bind methods
		this.clear = this.clear.bind(this);
		this.query = this.query.bind(this);
		this.search = this.search.bind(this);
	}

	componentDidMount() {

		// Track hash changes
		Hash.subscribe(this.props.hash, this.search);

		// If we have a hash value
		let sHash = Hash.get(this.props.hash, null);
		if(sHash) {
			this.search(sHash);
		}
	}

	componentWillUnmount() {

		// Stop traching hash changes
		Hash.unsubscribe(this.props.hash, this.search);
	}

	clear() {
		Hash.set(this.props.hash);
	}

	query() {

		// Fetch the values from the parent
		let oValues = this.parent.value;

		// If there's anything
		if(!empty(oValues)) {

			// Turn them into JSON and store them in the hash
			Hash.set(this.props.hash, JSON.stringify(oValues));
		}
	}

	search(values) {

		// Decode the values
		values = JSON.parse(values);

		// If there's no data
		if(empty(values)) {
			return;
		}

		// Set the parent's values
		this.parent.value = values;

		// Run the search
		Rest.read(this.props.service, this.props.noun, {
			filter: values
		}).then(res => {

			// If there's an error
			if(res.error && !res._handled) {
				this.searchError(res.error);
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', res.warning);
			}

			// If there's data
			if(res.data) {

				// Send it to the success message
				if(this.props.success) {
					this.props.success(res.data);
				}
			}
		})
	}

	searchError(error) {
		if(error.code === 1001) {
			this.parent.error(error.msg);
		} else if(error.code.toString() in this.props.handleErrors) {

			// If the value is already an object
			if(isObject(this.props.handleErrors[error.code.toString()])) {
				this.parent.error(this.props.handleErrors[error.code.toString()]);
			} else {
				let oErrors = this.props.handleErrors[error.code.toString()](error);
				if(isObject(oErrors)) {
					this.parent.error(oErrors);
				}
			}
		} else {
			Events.trigger('error', error);
		}
	}

	render() {
		return (
			<Box className={"search _" + this.state.name}>
				<Parent
					dynamicOptions={this.props.dynamicOptions}
					gridSizes={this.props.gridSizes}
					label={this.props.label}
					ref={el => this.parent = el}
					name={this.props.name}
					node={this.props.tree}
					onEnter={this.query}
					type="search"
					validation={false}
				/>
				<Box className="actions">
					<Button variant="contained" color="primary" onClick={this.query}>Search</Button>
				</Box>
			</Box>
		);
	}
}

// Valid props
Search.propTypes = {
	dynamicOptions: PropTypes.arrayOf(PropTypes.exact({
		node: PropTypes.string.isRequired,
		trigger: PropTypes.string.isRequired,
		options: PropTypes.object.isRequired
	})),
	gridSizes: PropTypes.objectOf(
		PropTypes.exact({
			xs: PropTypes.number,
			sm: PropTypes.number,
			md: PropTypes.number,
			lg: PropTypes.number,
			xl: PropTypes.number
		})
	),
	handleErrors: PropTypes.objectOf(
		PropTypes.oneOfType([
			PropTypes.func,
			PropTypes.objectOf(PropTypes.string)
		])
	),
	hash: PropTypes.string.isRequired,
	label: PropTypes.oneOf(['above', 'none', 'placeholder']),
	name: PropTypes.string.isRequired,
	noun: PropTypes.string.isRequired,
	service: PropTypes.string.isRequired,
	success: PropTypes.func,
	tree: PropTypes.instanceOf(FormatOC.Tree).isRequired,
}

// Default props
Search.defaultProps = {
	gridSizes: {__default__: {xs: 12, sm: 6, lg: 3}},
	handleErrors: {},
	label: 'placeholder'
}
