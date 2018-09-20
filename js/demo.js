/**
 * demo.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{
	// Calculates the offsetTop or offsetLeft of an element relative to the viewport 
	// (not counting with any transforms the element might have)
	const getOffset = (elem, axis) => {
		let offset = 0;
		const type = axis === 'top' ? 'offsetTop' : 'offsetLeft';
		do {
			if ( !isNaN( elem[type] ) )
			{
				offset += elem[type];
			}
		} while( elem = elem.offsetParent );
		return offset;
	}
	// Calculates the distance between two points.
	const distance = (p1,p2) => Math.hypot(p2.x-p1.x, p2.y-p1.y);
	// Generates a random number.
	const randNumber = (min,max) => Math.floor(Math.random() * (max - min + 1)) + min;
	// Gets the mouse position. From http://www.quirksmode.org/js/events_properties.html#position
	const getMousePos = (e) => {
		let posx = 0;
		let posy = 0;
		if (!e) e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy }
	};
	// Returns the rotation angle of an element.
	const getAngle = (el) => {
		const st = window.getComputedStyle(el, null);
		const tr = st.getPropertyValue('transform');
		let values = tr.split('(')[1];
		values = values.split(')')[0];
		values = values.split(',');
		return Math.round(Math.asin(values[1]) * (180/Math.PI));
	};
	// Scroll control functions. Taken from https://stackoverflow.com/a/4770179.
	const keys = {37: 1, 38: 1, 39: 1, 40: 1};
	const preventDefault = (e) => {
		e = e || window.event;
		if (e.preventDefault)
			e.preventDefault();
		e.returnValue = false;  
	}
	const preventDefaultForScrollKeys = (e) => {
		if (keys[e.keyCode]) {
			preventDefault(e);
			return false;
		}
	}
	const disableScroll = () => {
		if (window.addEventListener) // older FF
			window.addEventListener('DOMMouseScroll', preventDefault, false);
		window.onwheel = preventDefault; // modern standard
		window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
		window.ontouchmove  = preventDefault; // mobile
		document.onkeydown  = preventDefaultForScrollKeys;
	}
	const enableScroll = () => {
		if (window.removeEventListener)
			window.removeEventListener('DOMMouseScroll', preventDefault, false);
		window.onmousewheel = document.onmousewheel = null; 
		window.onwheel = null; 
		window.ontouchmove = null;  
		document.onkeydown = null;  
	}
	
	// The GridItem class.
    class GridItem {
        constructor(el) {
			this.DOM = {el: el};
			// The rectangle element around the image.
			this.DOM.bg = this.DOM.el.querySelector('.grid__item-bg');
			// The following DOM elements are elements that will move/tilt when hovering the item.
			this.DOM.tilt = {};
			// The image.
			this.DOM.imgWrap = this.DOM.el.querySelector('.grid__item-wrap');
			this.DOM.tilt.img = this.DOM.imgWrap.querySelector('img');
			// The title (vertical text).
			this.DOM.tilt.title = this.DOM.el.querySelector('.grid__item-title');
			// The number (horizontal letter/number code).
			this.DOM.tilt.number = this.DOM.el.querySelector('.grid__item-number');
			// Split the number into spans using charming.js
			charming(this.DOM.tilt.number);
			// And access the spans/letters.
			this.DOM.numberLetters = this.DOM.tilt.number.querySelectorAll('span');
			// Configuration for when moving/tilting the elements on hover.
			this.tiltconfig = {   
                title: {translation : {x: [-8,8], y: [4,-4]}},
                number: {translation : {x: [-5,5], y: [-10,10]}},
                img: {translation : {x: [-15,15], y: [-10,10]}}
			};
			// Get the rotation angle value of the image element.
			// This will be used to rotate the DOM.bg to the same value when expanding/opening the item.
			this.angle = getAngle(this.DOM.tilt.img);
			// Init/Bind events.
            this.initEvents();
		}
		initEvents() {
			/**
			 * Mouseenter: 
			 * - Scale up the DOM.bg element.
			 * - Animate the number letters.
			 * 
			 * Mousemove: 
			 * - tilt - move both the number, image and title elements. 
			 * 
			 * 
			 * Mouseleave: 
			 * - Scale down the DOM.bg element.
			 * - Animate the number letters.
			 */
			this.toggleAnimationOnHover = (type) => {
				// Scale up the bg element.
				TweenMax.to(this.DOM.bg, 1, {
					ease: Expo.easeOut,
					scale: type === 'mouseenter' ? 1.15 : 1
				});
				// Animate the number letters.
				this.DOM.numberLetters.forEach((letter,pos) => {
					TweenMax.to(letter, .2, {
						ease: Quad.easeIn,
						delay: pos*.1,
						y: type === 'mouseenter' ? '-50%' : '50%',
						opacity: 0,
						onComplete: () => {
							TweenMax.to(letter, type === 'mouseenter' ? 0.6 : 1, {
								ease: type === 'mouseenter' ? Expo.easeOut : Elastic.easeOut.config(1,0.4),
								startAt: {y: type === 'mouseenter' ? '70%' : '-70%', opacity: 0},
								y: '0%',
								opacity: 1
							});
						}
					});
				});
			};
			this.mouseenterFn = (ev) => {
				if ( !allowTilt ) return;
				this.toggleAnimationOnHover(ev.type);
            };
            this.mousemoveFn = (ev) => requestAnimationFrame(() => {
				if ( !allowTilt ) return;
                this.tilt(ev);
            });
            this.mouseleaveFn = (ev) => {
				if ( !allowTilt ) return;
				this.resetTilt();
				this.toggleAnimationOnHover(ev.type);
            };
            this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
            this.DOM.el.addEventListener('mousemove', this.mousemoveFn);
            this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
		}
		tilt(ev) {
			// Get mouse position.
			const mousepos = getMousePos(ev);
            // Document scrolls.
            const docScrolls = {left : body.scrollLeft + docEl.scrollLeft, top : body.scrollTop + docEl.scrollTop};
            const bounds = this.DOM.el.getBoundingClientRect();
            // Mouse position relative to the main element (this.DOM.el).
            const relmousepos = {
                x : mousepos.x - bounds.left - docScrolls.left, 
                y : mousepos.y - bounds.top - docScrolls.top 
            };
            // Movement settings for the tilt elements.
            for (let key in this.DOM.tilt) {
				let t = this.tiltconfig[key].translation;
				// Animate each of the elements..
                TweenMax.to(this.DOM.tilt[key], 2, {
                    ease: Expo.easeOut,
                    x: (t.x[1]-t.x[0])/bounds.width*relmousepos.x + t.x[0],
                    y: (t.y[1]-t.y[0])/bounds.height*relmousepos.y + t.y[0]
                });
            }
		}
		resetTilt() {
			for (let key in this.DOM.tilt ) {
                TweenMax.to(this.DOM.tilt[key], 2, {
					ease: Elastic.easeOut.config(1,0.4),
                    x: 0,
                    y: 0
                });
            }
		}
		/**
		 * Hides the item:
		 * - Scales down and fades out the image and bg elements.
		 * - Moves down and fades out the title and number elements.
		 */
		hide(withAnimation = true) { this.toggle(withAnimation,false); }
		/**
		 * Resets.
		 */
		show(withAnimation = true) { this.toggle(withAnimation); }
		toggle(withAnimation, show = true) {
			TweenMax.to(this.DOM.tilt.img, withAnimation ? 0.8 : 0, {
				ease: Expo.easeInOut,
				delay: !withAnimation ? 0 : show ? 0.15 : 0,
				scale: show ? 1 : 0,
				opacity: show ? 1 : 0,
			});
			TweenMax.to(this.DOM.bg, withAnimation ? 0.8 : 0, {
				ease: Expo.easeInOut,
				delay: !withAnimation ? 0 : show ? 0 : 0.15,
				scale: show ? 1 : 0,
				opacity: show ? 1 : 0
			});
			this.toggleTexts(show ? 0.45 : 0, withAnimation, show);
		}
		// hides the texts (translate down and fade out).
		hideTexts(delay = 0, withAnimation = true) { this.toggleTexts(delay, withAnimation, false); }
		// shows the texts (reset transforms and fade in).
		showTexts(delay = 0, withAnimation = true) { this.toggleTexts(delay, withAnimation); }
		toggleTexts(delay, withAnimation, show = true) {
			TweenMax.to([this.DOM.tilt.title, this.DOM.tilt.number], !withAnimation ? 0 : show ? 1 : 0.5, {
				ease: show ? Expo.easeOut : Quart.easeIn,
				delay: !withAnimation ? 0 : delay,
				y: show ? 0 : 20,
				opacity: show ? 1 : 0
			});
		}
	}

	// The Content class. Represents one content item per grid item.
    class Content {
        constructor(el) {
			this.DOM = {el: el};
			// The content elements: image, title, subtitle and text.
            this.DOM.img = this.DOM.el.querySelector('.content__item-img');
            this.DOM.title = this.DOM.el.querySelector('.content__item-title');
            this.DOM.subtitle = this.DOM.el.querySelector('.content__item-subtitle');
			this.DOM.text = this.DOM.el.querySelector('.content__item-text');
			// Split the title into spans using charming.js
			charming(this.DOM.title);
			// And access the spans/letters.
			this.DOM.titleLetters = this.DOM.title.querySelectorAll('span');
			this.titleLettersTotal = this.DOM.titleLetters.length;
		}
		/**
		 * Show/Hide the content elements (title letters, the subtitle and the text).
		 */
        show(delay = 0, withAnimation = true) { this.toggle(delay, withAnimation); }
        hide(delay = 0, withAnimation = true) { this.toggle(delay, withAnimation, false); }
		toggle(delay, withAnimation, show = true) {
			setTimeout(() => {
				
				this.DOM.titleLetters.forEach((letter,pos) => {
					TweenMax.to(letter, !withAnimation ? 0 : show ? .6 : .3, {
						ease: show ? Back.easeOut : Quart.easeIn,
						delay: !withAnimation ? 0 : show ? pos*.05 : (this.titleLettersTotal-pos-1)*.04,
						startAt: show ? {y: '50%', opacity: 0} : null,
						y: show ? '0%' : '50%',
						opacity: show ? 1 : 0
					});
				});
				this.DOM.subtitle.style.opacity = show ? 1 : 0;
				this.DOM.text.style.opacity = show ? 1 : 0;

			}, withAnimation ? delay*1000 : 0 );
		}
    }

	// The Grid class.
    class Grid {
        constructor(el) {
			this.DOM = {el: el};
			// The grid wrap.
			this.DOM.gridWrap = this.DOM.el.parentNode;
			// The grid items.
            this.items = [];
            Array.from(this.DOM.el.querySelectorAll('.grid__item')).forEach(itemEl => this.items.push(new GridItem(itemEl)));
            // The total number of items.
			this.itemsTotal = this.items.length;
			// The content items.
			this.contents = [];
			Array.from(document.querySelectorAll('.content > .content__item')).forEach(contentEl => this.contents.push(new Content(contentEl)));
			// Back control and scroll indicator (elements shown when the item´s content is open).
			this.DOM.closeCtrl = document.querySelector('.content__close');
			this.DOM.scrollIndicator = document.querySelector('.content__indicator');
			// The open grid item.
			this.current = -1;
            // Init/Bind events.
            this.initEvents();
		}
		initEvents() {
			// Clicking a grid item hides all the other grid items (ordered by proximity to the clicked one) 
			// and expands/opens the clicked one.
			for (let item of this.items) {
				item.DOM.el.addEventListener('click', (ev) => {
					ev.preventDefault();
					this.openItem(item);
				});
			}
			// Close item.
			this.DOM.closeCtrl.addEventListener('click', () => this.closeItem());
			// (Incomplete! For now: if theres an open item, then show back the grid.
			this.resizeFn = () => {
				if (this.current === -1 || winsize.width === window.innerWidth) return;
				this.closeItem(false);
			};
			window.addEventListener('resize', this.resizeFn);
		}
		getSizePosition(el, scrolls = true) {
			const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    		const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
			return {
				width: el.offsetWidth,
				height: el.offsetHeight,
				left: scrolls ? getOffset(el, 'left')-scrollLeft : getOffset(el, 'left'),
				top: scrolls ? getOffset(el, 'top')-scrollTop : getOffset(el, 'top')
			};
		}
		openItem(item) {
			if ( this.isAnimating ) return;
			this.isAnimating = true;
			// Get the current scroll position.
			this.scrollPos = window.scrollY;
			// Disable page scrolling.
			disableScroll();
			// Disable tilt.
			allowTilt = false;
			// Set the current value (index of the clicked item).
			this.current = this.items.indexOf(item);
			// Hide all the grid items except the one we want to open.
			this.hideAllItems(item);
			// Also hide the item texts.
			item.hideTexts();
			// Set the item´s z-index to a high value so it overlaps any other grid item.
			item.DOM.el.style.zIndex = 1000;
			// Get the "grid__item-bg" width and height and set it explicitly, 
			// also set its top and left respective to the page.
			const itemDim = this.getSizePosition(item.DOM.el);
			item.DOM.bg.style.width = `${itemDim.width}px`;
			item.DOM.bg.style.height = `${itemDim.height}px`;
			item.DOM.bg.style.left = `${itemDim.left}px`;
			item.DOM.bg.style.top = `${itemDim.top}px`;
			// Set it to position fixed.
			item.DOM.bg.style.position = 'fixed';
			// Calculate the viewport diagonal. We will need to take this in consideration when scaling up the item´s bg element.
			const d = Math.hypot(winsize.width, winsize.height);
			// Scale up the item´s bg element.
			TweenMax.to(item.DOM.bg, 1.2, {
				ease: Expo.easeInOut,
				delay: 0.4,
				x: winsize.width/2 - (itemDim.left+itemDim.width/2),
				y: winsize.height/2 - (itemDim.top+itemDim.height/2),
				scaleX: d/itemDim.width,
				scaleY: d/itemDim.height,
				rotation: -1*item.angle*2
			});
			// Get the content element respective to this grid item.
			const contentEl = this.contents[this.current];
			// Set it to current.
			contentEl.DOM.el.classList.add('content__item--current');
			// Calculate the item´s image and content´s image sizes and positions. 
			// We need this so we can scale up and translate the item´s image to the same size and position of the content´s image.
			const imgDim = this.getSizePosition(item.DOM.imgWrap);
			const contentImgDim = this.getSizePosition(contentEl.DOM.img, false);
			// Show the back control and scroll indicator and all the item´s content elements (1 second delay).
			this.showContentElems(contentEl, 1);
			// Animate the item´s image.
			TweenMax.to(item.DOM.tilt.img, 1.2, {
				ease: Expo.easeInOut,
				delay: 0.55,
				scaleX: contentImgDim.width/imgDim.width,
				scaleY: contentImgDim.height/imgDim.height,
				x: (contentImgDim.left+contentImgDim.width/2)-(imgDim.left+imgDim.width/2),
				y: (contentImgDim.top+contentImgDim.height/2)-(imgDim.top+imgDim.height/2),
				rotation: 0,
				onComplete: () => {
					// Hide the item´s image and show the content´s image. Should both be overlapping.
					item.DOM.tilt.img.style.opacity = 0;
					contentEl.DOM.img.style.visibility = 'visible';
					// Set the main content wrapper to absolute so it´s position at the top.
					contentEl.DOM.el.parentNode.style.position = 'absolute';
					// Hiding the grid scroll.
					this.DOM.gridWrap.classList.add('grid-wrap--hidden');
					// Scroll up the page.
					window.scrollTo(0, 0);
					// Enable page scrolling.
					enableScroll();
					this.isAnimating = false;
				}
			});
		}
		closeItem(withAnimation = true) {
			if ( this.isAnimating ) return;
			this.isAnimating = true;
			// Get the content element respective to this grid item.
			const contentEl = this.contents[this.current];
			// Scroll to the previous scroll position before opening the item.
			window.scrollTo(0, this.scrollPos);
			contentEl.DOM.el.parentNode.style.position = 'fixed';
			// Disable page scrolling.
			disableScroll();
			// Showing the grid scroll.
			this.DOM.gridWrap.classList.remove('grid-wrap--hidden');
			// The item that is open.
			const item = this.items[this.current];
			// Hide the back control and scroll indicator and all the item´s content elements.
			this.hideContentElems(contentEl, 0, withAnimation);
			// Set the grid´s image back to visible and hide the content´s one.
			item.DOM.tilt.img.style.opacity = 1;
			contentEl.DOM.img.style.visibility = 'hidden';
			// Animate the grid´s image back to the grid position.
			TweenMax.to(item.DOM.tilt.img, withAnimation ? 1.2 : 0, {
				ease: Expo.easeInOut,
				scaleX: 1,
				scaleY: 1,
				x: 0,
				y: 0,
				rotation: item.angle*2
			});
			// And also the bg element.
			TweenMax.to(item.DOM.bg, withAnimation ? 1.2 : 0, {
				ease: Expo.easeInOut,
				delay: 0.15,
				x: 0,
				y: 0,
				scaleX: 1,
				scaleY: 1,
				rotation: 0,
				onComplete: () => {
					contentEl.DOM.el.classList.remove('content__item--current');
					item.DOM.bg.style.position = 'absolute';
					item.DOM.bg.style.left = '0px';
					item.DOM.bg.style.top = '0px';
					this.current = -1;
					allowTilt = true;
					item.DOM.el.style.zIndex = 0;
					enableScroll();
					this.isAnimating = false;
				}
			});
			// Show all the grid items except the one we want to close.
			this.showAllItems(item, withAnimation);
			// Also show the item texts. (1s delay)
			item.showTexts(1, withAnimation);
		}
		/**
		 * Toggle the content elements.
		 */
		showContentElems(contentEl, delay = 0, withAnimation = true) { this.toggleContentElems(contentEl, delay, withAnimation); }
		hideContentElems(contentEl, delay = 0, withAnimation = true) { this.toggleContentElems(contentEl, delay, withAnimation, false); }
		toggleContentElems(contentEl, delay, withAnimation, show = true) {
			// toggle the back control and scroll indicator.
			TweenMax.to([this.DOM.closeCtrl, this.DOM.scrollIndicator], withAnimation ? 0.8 : 0, {
				ease: show ? Expo.easeOut : Expo.easeIn,
				delay: withAnimation ? delay : 0,
				startAt: show ? {y: 60} : null,
				y: show ? 0 : 60,
				opacity: show ? 1 : 0
			});
			if ( show ) {
				contentEl.show(delay, withAnimation);
			}
			else {
				contentEl.hide(delay, withAnimation);
			}
		}
		// Based on https://stackoverflow.com/q/25481717
		sortByDist(refPoint, itemsArray) {
			let distancePairs = [];
			let output = [];
	
			for(let i in itemsArray) {
				const rect = itemsArray[i].DOM.el.getBoundingClientRect();
				distancePairs.push([distance(refPoint,{x:rect.left+rect.width/2, y:rect.top+rect.height/2}), i]);
			}
	
			distancePairs.sort((a,b) => a[0]-b[0]);
	
			for(let p in distancePairs) {
				const pair = distancePairs[p];
				output.push(itemsArray[pair[1]]);
			}
	
			return output;
		}
		/**
		 * Shows/Hides all the grid items except the "exclude" item.
		 * The items will be sorted based on the distance to the exclude item.
		 */
		showAllItems(exclude, withAnimation = true) { this.toggleAllItems(exclude, withAnimation); }
		hideAllItems(exclude, withAnimation = true) { this.toggleAllItems(exclude, withAnimation, false); }
		toggleAllItems(exclude, withAnimation, show = true) {
			if ( !withAnimation ) {
				this.items.filter(item => item != exclude).forEach((item, pos) => item[show ? 'show' : 'hide'](withAnimation));
			}
			else {
				const refrect = exclude.DOM.el.getBoundingClientRect(); 
				const refPoint = {
					x: refrect.left+refrect.width/2, 
					y: refrect.top+refrect.height/2
				};
				this.sortByDist(refPoint, this.items.filter(item => item != exclude))
					.forEach((item, pos) => setTimeout(() => item[show ? 'show' : 'hide'](), show ? 300+pos*70 : pos*70));
			}
		}
	}

	// Controls whether the item will have the "tilt" movement on hover (mousemove) or not.
	let allowTilt = true;
	
	// Caching some stuff..
	const body = document.body;
	const docEl = document.documentElement;
	
	// Window sizes.
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);

	// Initialize the Grid.
	const grid = new Grid(document.querySelector('.grid'));

	// Preload images.
	imagesLoaded(document.querySelectorAll('.grid__item-img'), () => {
		body.classList.remove('loading');
		var msnry = new Masonry( grid.DOM.el, {
			// options
			itemSelector: '.grid__item',
			columnWidth: 260,
			gutter: 100,
			fitWidth: true
		});
	});
}
