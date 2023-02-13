/**
 * Format Parent
 *
 * Handles groups of FormatOC nodes
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2022-03-19
 */

// Ouroboros
import events from '@ouroboros/events';
import { empty } from '@ouroboros/tools';
import FormatOC from 'format-oc';

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// Components
import Child from './Child';
import { SelectHash } from './Shared';

/**
 * Parent
 *
 * Creates a grid of Nodes using the FormatOC Parent structure
 *
 * @name Parent
 * @access public
 * @extends React.Component
 */
export default class Parent extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Init state
		this.state = this.generateState();

		// Init the field refs
		this.fields = {};
	}

	componentDidUpdate(prevProps) {

		// If the error changed
		if(prevProps.error !== this.props.error) {
			this.error(this.props.error);
		}

		// If the Node changed
		if(prevProps.node !== this.props.node) {
			this.setState(this.generateState());
		}
	}

	error(errors) {
		for(var k in errors) {
			if(k in this.fields) {
				this.fields[k].error(errors[k]);
			} else {
				events.trigger('error', 'Field not found error: ' + errors[k] + ' (' + k + ')');
			}
		}
	}

	generateState() {

		// Init the list elements
		let lElements = [];

		// Get the React special section if there is one
		let oReact = this.props.node.special('ui') || {};

		// Init the order
		let lOrder = null;

		// If we were passed specific fields
		if(this.props.fields) {
			lOrder = this.props.fields;
		}

		// Else, if we have the specific type in the react section
		else if(this.props.type in oReact) {
			lOrder = oReact[this.props.type];
		}

		// Else, if we have the generic 'order' in the react section
		else if('order' in oReact) {
			lOrder = oReact['order'];
		}

		// Else, just use the keys of the node
		else {
			lOrder = this.props.node.keys();
		}

		// If we have any dynamic options
		let oDynamicOptions = null;
		if(this.props.dynamicOptions && this.props.dynamicOptions.length) {

			// Set the var to an object
			oDynamicOptions = {};

			// Go through each one
			for(let o of this.props.dynamicOptions) {

				// If the node doesn't exist
				if(!this.props.node.get(o.node)) {
					throw new Error(`Node "${o.node}" used as a node in "dynamicOptions" attribute does not exist in the Parent`);
				}

				// If the trigger doesn't exist
				if(!this.props.node.get(o.trigger)) {
					throw new Error(`Node "${o.trigger}" used as a trigger in "dynamicOptions" attribute does not exist in the Parent`);
				}

				// Get the react section of the node
				let oReact = this.props.node.get(o.node).special('ui') || {};

				// Create a SelectHash using the options and the current value
				//	of the node, and store it under the node's options
				oReact.options = new SelectHash(
					o.options,
					this.props.value[o.trigger] || null
				);

				// Overwrite the react special
				this.props.node.get(o.node).special('ui', oReact);

				// Store the callback for the trigger
				oDynamicOptions[o.trigger] = oReact.options.key.bind(oReact.options);
			}
		}

		// Go through each node
		for(let i in lOrder) {

			// Get the node
			let oChild = this.props.node.get(lOrder[i]);

			// Get the class
			let sClass = oChild.class();

			// Get the value
			let mValue = (lOrder[i] in this.props.value) ?
				this.props.value[lOrder[i]] :
				null;

			// Grid sizes
			let gridSizes = this.props.gridSizes[lOrder[i]] ||
							this.props.gridSizes.__default__ ||
							{xs: 12, sm: 6, lg: 3}

			// Check what kind of node it is
			switch(sClass) {
				case 'ArrayNode':
				case 'HashNode':
				case 'Parent':
					lElements.push(
						<Grid key={i} item {...gridSizes}>
							{Child.create(sClass, {
								label: this.props.label,
								nodeVariant: this.props.nodeVariant,
								ref: el => this.fields[lOrder[i]] = el,
								name: lOrder[i],
								node: oChild,
								onEnter: this.props.onEnter,
								returnAll: this.props.returnAll,
								type: this.props.type,
								value: mValue,
								validation: this.props.validation
							})}
						</Grid>
					);
					break;
				case 'Node':
					let oProps = {
						label: this.props.label,
						ref: el => this.fields[lOrder[i]] = el,
						name: lOrder[i],
						node: oChild,
						onEnter: this.props.onEnter,
						type: this.props.type,
						value: mValue,
						validation: this.props.validation,
						variant: this.props.nodeVariant
					}

					// If we have a trigger
					if(oDynamicOptions && lOrder[i] in oDynamicOptions) {
						oProps.onChange = oDynamicOptions[lOrder[i]];
					}

					// Create the new element and push it to the list
					lElements.push(
						<Grid key={i} item {...gridSizes}>
							{Child.create(sClass, oProps)}
						</Grid>
					);
					break;
				default:
					throw new Error('Invalid Node type in parent of child: ' + lOrder[i]);
			}
		}

		// Return the list of elements we generated
		return {
			elements: lElements,
			order: lOrder,
			title: oReact.title || false
		};
	}

	render() {
		return (
			<React.Fragment>
				{this.state.title &&
					<Typography variant="h6">{this.state.title}</Typography>
				}
				<Grid container spacing={this.props.gridSpacing} className={"nodeParent _" + this.props.name}>
					{this.state.elements}
				</Grid>
			</React.Fragment>
		);
	}

	valid() {

		// Valid?
		let bValid = true;

		// Go through each item and validate it
		for(let k of this.state.order) {

			// Get the node
			let oNode = this.props.node.get(k);

			// If we have a Node
			if(oNode.class() === 'Node') {

				// If the value is invalid
				if(!oNode.valid(this.fields[k].value)) {
					this.fields[k].error(oNode.validation_failures[0][1]);
					bValid = false;
				}
			}

			// Else, if we have a more complex type
			else {

				// If the Component is invalid
				if(!this.fields[k].valid()) {
					bValid = false;
				}
			}
		}

		// Return valid state
		return bValid;
	}

	get value() {

		// Init the return value
		let oRet = {};

		// Go through all the fields used
		for(let k in this.fields) {

			// Get the new value
			let newVal = this.fields[k].value;

			// If we're in update mode and the returnAll flag is not set
			if(this.props.type === 'update' && !this.props.returnAll) {

				// If the value is different
				if(this.props.value[k] !== newVal) {
					oRet[k] = newVal;
				}
			}

			// Else we're in insert or search mode
			else {

				// If the value isn't null, add it
				if(!empty(newVal)) {
					oRet[k] = newVal;
				}
			}
		}

		// Return the values
		return oRet;
	}

	set value(val) {
		for(let k in val) {
			this.fields[k].value = val[k];
		}
	}
}

// Register the component
Child.register('Parent', Parent);

// Valid props
Parent.propTypes = {
	dynamicOptions: PropTypes.arrayOf(PropTypes.exact({
		node: PropTypes.string.isRequired,
		trigger: PropTypes.string.isRequired,
		options: PropTypes.object.isRequired
	})),
	fields: PropTypes.arrayOf(PropTypes.string),
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
	name: PropTypes.string.isRequired,
	node: PropTypes.instanceOf(FormatOC.Parent).isRequired,
	nodeVariant: PropTypes.oneOf(['filled', 'outlined', 'standard']),
	onEnter: PropTypes.func,
	returnAll: PropTypes.bool,
	type: PropTypes.oneOf(['create', 'search', 'update']).isRequired,
	value: PropTypes.object,
	validation: PropTypes.bool
}

// Default props
Parent.defaultProps = {
	dynamicOptions: [],
	gridSizes: {__default__: {xs: 12, sm: 6, lg: 3}},
	gridSpacing: 2,
	label: 'placeholder',
	nodeVariant: 'outlined',
	onEnter: () => {},
	returnAll: false,
	value: {},
	validation: true
}
