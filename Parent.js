/**
 * Format Parent
 *
 * Handles groups of FormatOC nodes
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
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// Components
import Child from './Child';

// Generic modules
import Events from 'shared/generic/events';

// Parent Component
export default class Parent extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Init state
		this.state = this.generateState();

		// Init the field refs
		this.fields = {};
	}

	error(errors) {
		for(var k in errors) {
			if(k in this.fields) {
				this.fields[k].error(errors[k]);
			} else {
				Events.trigger('error', 'Field not found error: ' + errors[k] + ' (' + k + ')');
			}
		}
	}

	generateState() {

		// Init the list elements
		let lElements = [];

		// Get the React special section if there is one
		let oReact = this.props.node.special('react') || {};

		// Init the order
		let lOrder = null;

		// If we have the specific type
		if(this.props.type in oReact) {
			lOrder = oReact[this.props.type];
		}

		// Else, if we have the generic 'order'
		else if('order' in oReact) {
			lOrder = oReact['order'];
		}

		// Else, just use the keys
		else {
			lOrder = this.props.node.keys();
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

			// Check what kind of node it is
			switch(sClass) {
				case 'ArrayNode':
				case 'Parent':
					lElements.push(
						<Grid key={i} item xs={12}>
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
					lElements.push(
						<Grid key={i} item xs={12} sm={6} lg={3}>
							{Child.create(sClass, {
								label: this.props.label,
								ref: el => this.fields[lOrder[i]] = el,
								name: lOrder[i],
								node: oChild,
								onEnter: this.props.onEnter,
								type: this.props.type,
								value: mValue,
								validation: this.props.validation,
								variant: this.props.nodeVariant
							})}
						</Grid>
					);
					break;
				default:
					throw new Error('Invalid Node type in parent of child: ' + lOrder[i]);
			}
		}

		// Return the list of elements we generated
		return {
			"elements": lElements,
			"order": lOrder,
			"title": oReact.title || false
		};
	}

	render() {
		return (
			<React.Fragment>
				{this.state.title &&
					<Typography variant="h6">{this.state.title}</Typography>
				}
				<Grid container spacing={2} className={"nodeParent _" + this.props.name}>
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

			// Check if the current value is valid
			if(!oNode.valid(this.fields[k].value)) {
				this.fields[k].error(oNode.validation_failures[0][1]);
				bValid = false;
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
				if(newVal !== null) {
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
	label: 'placeholder',
	nodeVariant: 'outlined',
	onEnter: () => {},
	returnAll: false,
	value: {},
	validation: true
}
