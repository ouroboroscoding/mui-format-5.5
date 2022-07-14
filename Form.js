/**
 * Form
 *
 * Handles creating forms using Format Trees
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
import Typography from '@mui/material/Typography';

// Format
import Parent from './Parent';

// Communications
import Rest from 'shared/communication/rest';

// Generic
import Events from 'shared/generic/events';
import { isObject } from 'shared/generic/tools';

/**
 * Form
 *
 * Handles create/update forms using Parent
 *
 * @name Form
 * @access public
 * @extends React.Component
 */
export default class Form extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Get the display options
		let oReact = props.tree.special('react') || {};

		// If there's no primary, assume '_id'
		if(!('primary' in oReact)) {
			oReact.primary = '_id';
		}

		// Set the initial state
		this.state = {
			"key": ('value' in props && props.value && oReact.primary in props.value) ?
						props.value[oReact.primary] : null,
			"primary": oReact.primary,
			"type": props['type']
		}

		// Init the parent
		this.parent = null;

		// Bind methods
		this.cancel = this.cancel.bind(this);
		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
	}

	cancel() {

		// If the prop is a function
		if(typeof this.props.cancel === 'function') {
			this.props.cancel();
		}
	}

	create() {

		// Make sure each child of the parent is valid
		if(!this.parent.valid()) {
			return;
		}

		// Fetch the values from the parent
		let oValues = this.parent.value;

		// If we have a beforeSubmit function
		if(this.props.beforeSubmit) {
			oValues = this.props.beforeSubmit(oValues, 'create');
			if(oValues === false) {
				return;
			}
		}

		// If submit if overridden
		if(this.props.overrideSubmit) {
			this.props.overrideSubmit(oValues).then(res => {
				this.createSuccess(oValues, res)
			}, error => {
				this.submitError(error);
			});
		}

		// Else, use the service/noun to create the object
		else {

			// Send the data to the service via rest
			Rest.create(this.props.service,
						this.props.noun,
						oValues
			).done(res => {

				// If there's an error
				if(res.error && !res._handled) {
					this.submitError(res.error);
				}

				// If there's a warning
				if(res.warning) {
					Events.trigger('warning', res.warning);
				}

				// If there's data
				if(res.data) {
					this.createSuccess(oValues, res.data);
				}
			});
		}
	}

	createSuccess(data, res) {

		// Show the popup
		Events.trigger('success', 'Created');

		// If there's a success callback
		if(this.props.success) {

			// If we got an object, assume we need to merge it
			//	with the existing values
			if(isObject(res)) {
				data = {
					...data,
					...res
				}
			}

			// Else, we probably just got the primary key
			else {

				// Add the returned key to the existing data
				data[this.state.primary] = res;
			}

			// Pass it all to the callback
			this.props.success(data, res);
		}
	}

	render() {
		let title, submit, callback;
		if(this.state.type === 'create') {
			if(this.props.title) {
				title = this.props.title === true ? 'Create ' + this.props.tree._name : this.props.title;
			}
			submit = 'Create';
			callback = this.create;
		} else {
			if(this.props.title) {
				title = this.props.title === true ? 'Update ' + this.props.tree._name : this.props.title;
			}
			submit = 'Save';
			callback = this.update;
		}

		return (
			<Box className={"form _" + this.props.tree._name}>
				{this.props.title &&
					<Typography className="form_title">{title}</Typography>
				}
				<Parent
					dynamicOptions={this.props.dynamicOptions}
					fields={this.props.fields}
					gridSizes={this.props.gridSizes}
					label={this.props.label}
					ref={el => this.parent = el}
					name={this.props.tree._name}
					node={this.props.tree}
					onEnter={callback}
					type={this.state.type}
					value={this.props.value}
				/>
				<Box className="actions">
					{this.props.cancel &&
						<Button variant="contained" color="secondary" onClick={this.cancel}>Cancel</Button>
					}
					<Button variant="contained" color="primary" onClick={callback}>{submit}</Button>
				</Box>
			</Box>
		);
	}

	submitError(error) {
		if(error.code === 1001) {
			this.parent.error(Rest.toTree(error.msg));
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

	update() {

		// Make sure each child of the parent is valid
		if(!this.parent.valid()) {
			return;
		}

		// Fetch the values from the parent
		let oValues = this.parent.value;

		// Add the primary key if requested
		if(this.props.sendPrimary) {
			oValues[this.state.primary] = this.state.key;
		}

		// If we have a beforeSubmit function
		if(this.props.beforeSubmit) {
			oValues = this.props.beforeSubmit(oValues, 'update');
			if(oValues === false) {
				return;
			}
		}

		// If submit if overridden
		if(this.props.overrideSubmit) {
			this.props.overrideSubmit(oValues).then(res => {
				this.updateSuccess(oValues, res)
			}, error => {
				this.submitError(error);
			});
		}

		// Else, use the service/noun to create the object
		else {

			// Send the data to the service via rest
			Rest.update(this.props.service,
						this.props.noun,
						oValues
			).done(res => {

				// If there's an error
				if(res.error && !res._handled) {
					this.submitError(res.error);
				}

				// If there's a warning
				if(res.warning) {
					Events.trigger('warning', res.warning);
				}

				// If there's data
				if(res.data) {
					this.updateSuccess(oValues, res.data);
				}
			});
		}
	}

	updateSuccess(data, res) {

		// Show the popup
		Events.trigger('success', 'Saved');

		// If there's a success callback, call it with the returned data
		if(this.props.success) {
			this.props.success(data, res);
		}
	}

	get value() {
		return this.parent.value;
	}

	set value(val) {
		this.parent.value = val;
	}
}

// Valid props
Form.propTypes = {
	beforeSubmit: PropTypes.func,
	cancel: PropTypes.oneOfType([
		PropTypes.bool,
		PropTypes.func
	]),
	dynamicOptions: PropTypes.arrayOf(PropTypes.exact({
		node: PropTypes.string.isRequired,
		trigger: PropTypes.string.isRequired,
		options: PropTypes.object.isRequired
	})),
	fields: PropTypes.arrayOf(PropTypes.string),
	handleErrors: PropTypes.objectOf(
		PropTypes.oneOfType([
			PropTypes.func,
			PropTypes.objectOf(PropTypes.string)
		])
	),
	gridSizes: PropTypes.objectOf(
		PropTypes.exact({
			xs: PropTypes.number,
			sm: PropTypes.number,
			md: PropTypes.number,
			lg: PropTypes.number,
			xl: PropTypes.number
		})
	),
	gridSpacing: PropTypes.number,
	label: PropTypes.oneOf(['above', 'none', 'placeholder']),
	nodeVariant: PropTypes.oneOf(['filled', 'outlined', 'standard']),
	noun: PropTypes.string.isRequired,
	overrideSubmit: PropTypes.oneOfType([
		PropTypes.bool,
		PropTypes.func
	]),
	sendPrimary: PropTypes.bool,
	service: PropTypes.string.isRequired,
	success: PropTypes.func,
	title: PropTypes.oneOfType([
		PropTypes.bool,
		PropTypes.string
	]),
	tree: PropTypes.instanceOf(FormatOC.Tree).isRequired,
	type: PropTypes.oneOf(['create', 'update']).isRequired,
	value: PropTypes.object
}

// Default props
Form.defaultProps = {
	cancel: false,
	handleErrors: {},
	gridSizes: {__default__: {xs: 12, sm: 6, lg: 3}},
	gridSpacing: 2,
	label: 'placeholder',
	nodeVariant: 'outlined',
	overrideSubmit: false,
	sendPrimary: true,
	title: false,
	value: {}
}
