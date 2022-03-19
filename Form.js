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

// Form
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
		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
	}

	create() {

		// Make sure each child of the parent is valid
		if(!this.parent.valid()) {
			Events.trigger('error', 'Please fix invalid data');
			this.parent.error(Rest.toTree(this.props.tree.validation_failures));
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
					Events.trigger('warning', JSON.stringify(res.warning));
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
					label={this.props.label}
					ref={el => this.parent = el}
					name="user"
					node={this.props.tree}
					onEnter={callback}
					type={this.state.type}
					value={this.props.value}
				/>
				<Box className="actions">
					{this.props.cancel &&
						<Button variant="contained" color="secondary" onClick={this.props.cancel}>Cancel</Button>
					}
					<Button variant="contained" color="primary" onClick={callback}>{submit}</Button>
				</Box>
			</Box>
		);
	}

	submitError(error) {
		if(error.code === 1001) {
			this.parent.error(error.msg);
		} else if(error.code in this.props.errors) {
			Events.trigger('error', this.props.errors[error.code]);
		} else {
			Events.trigger('error', JSON.stringify(error.msg));
		}
	}

	update() {

		// Make sure each child of the parent is valid
		if(!this.parent.valid()) {
			Events.trigger('error', 'Please fix invalid data');
			this.parent.error(Rest.toTree(this.props.tree.validation_failures));
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
					Events.trigger('warning', JSON.stringify(res.warning));
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
	cancel: PropTypes.func,
	errors: PropTypes.object,
	label: PropTypes.oneOf(['above', 'none', 'placeholder']),
	name: PropTypes.string,
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
	errors: {},
	label: 'placeholder',
	nodeVariant: 'outlined',
	overrideSubmit: false,
	sendPrimary: true,
	title: false,
	value: {}
}
