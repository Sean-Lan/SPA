/*
 * spa.shell.js
 * shell module for SPA
 */

/* global spa, $ */
spa.shell = (function() {
    //--- BEGIN MODULE SCOPE VARIABLES ---
    var
        configMap = {
            anchor_schema_map: {
                chat: {
                    opened: true,
                    closed: true
                }
            },
            main_html: String() +
                '<div class="spa-shell-head">' +
                    '<div class="spa-shell-head-logo"></div>' +
                    '<div class="spa-shell-head-acct"></div>' +
                    '<div class="spa-shell-head-search"></div>' +
                '</div>' +
                '<div class="spa-shell-main">' +
                    '<div class="spa-shell-main-nav"></div>' +
                    '<div class="spa-shell-main-content"></div>' +
                '</div>' +
                '<div class="spa-shell-foot"></div>' +
            '<div class="spa-shell-modal"></div>',
            resize_interval: 200
        },
        stateMap = {
            $container: undefined,
            anchor_map: {},
            resize_idto: undefined
        },
        jqueryMap = {},
        copyAnchorMap, setJqueryMap,
        changeAnchorPart, onHashchange, onResize,
        setChatAnchor, initModule;
    //--- END MODULE SCOPE VARIABLES ---

    //--- BEGIN UTITLITY METHODS ---
    // Returns copy of stored anchor map; minimizes overhead
    copyAnchorMap = function() {
        return $.extend(true, {}, stateMap.anchor_map);
    };
    //--- END UTILITY METHODS ---

    //--- BEGIN UTILITY METHODS ---
    //--- END UTILITY METHODS ---

    //--- BEGIN DOM METHODS ---
    // Begin DOM method /setJqueryMap/
    setJqueryMap = function() {
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container
        };
    };
    // End DOM method /setJqueryMap/

    // Begin DOM method /changeAnchorPart/
    changeAnchorPart = function(arg_map) {
        var
            anchor_map_revise = copyAnchorMap(),
            bool_return = true,
            key_name, key_name_dep;
        // Begin merge changes into anchor map
        KEYVAL: for (key_name in arg_map) {
            if (arg_map.hasOwnProperty(key_name)) {
                // skip dependent keys during iteration
                if (key_name.indexOf('_') === 0) {
                    continue KEYVAL;
                }

                // update independent key value
                anchor_map_revise[key_name] = arg_map[key_name];

                // update matching dependent key
                key_name_dep = '_' + key_name;
                if (arg_map[key_name_dep]) {
                    anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                } else {
                    delete anchor_map_revise[key_name_dep];
                    delete anchor_map_revise['_s' + key_name_dep];
                }
            }
        }
            // End merge changes into anchor map

        // Begin attempt to update URI; revert if not successful
        try {
            $.uriAnchor.setAnchor(anchor_map_revise);
        } catch (error) {
            try {
                $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
            } catch (error) { // the original anchor_map is wrong.
                $.uriAnchor.setAnchor({}, null, true);
            }
            bool_return = false;
        }
        // End attempt to upate URI...

        return bool_return;
    };
    // End DOM method /changeAnchorPart/
    //--- END DOM METHODS ---

    //--- BEGIN EVENT HANDLERS ---
    // Begin Event handler /onHashchange/
    // Purpose: Handles the hashchange event
    // Arguments:
    //  * event - jQuery event object.
    // Settings: none
    // Returns: false
    // Actions:
    //  * Parse the URI anchor component
    //  * Compare proposed application state with current
    //  * Adjust the application only where proposed state
    //  differs from existing and is allowed by anchor schema
    //
    onHashchange = function() {
        var
            _s_chat_previous, _s_chat_proposed, s_chat_proposed,
            anchor_map_proposed,
            is_ok = true,
            anchor_map_previous = copyAnchorMap();

        // attempt to parse anchor
        try {
            anchor_map_proposed = $.uriAnchor.makeAnchorMap();
        } catch (error) {
            $.uriAnchor.setAnchor(anchor_map_previous, null, true);
            return false;
        }
        stateMap.anchor_map = anchor_map_proposed;

        // convenience vars
        _s_chat_previous = anchor_map_previous._s_chat;
        _s_chat_proposed = anchor_map_proposed._s_chat;

        // Begin adjust chat component if changed
        if ( ! anchor_map_previous
            || _s_chat_previous !== _s_chat_proposed ) {
            s_chat_proposed = anchor_map_proposed.chat;
            switch (s_chat_proposed) {
            case 'opened':
                is_ok = spa.chat.setSliderPosition( 'opened' );
                break;
            case 'closed':
                is_ok = spa.chat.setSliderPosition( 'closed' );
                break;
            default:
                spa.chat.setSliderPosition( 'closed' );
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
            }
        }
        // End adjust chat component if changed.

        // begin revert anchor if slider change denied
        if ( ! is_ok ) {
            if ( anchor_map_previous ) {
                $.uriAnchor.setAnchor( anchor_map_previous, null, true );
                stateMap.anchor_map = anchor_map_previous;
            } else {
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
            }
        }
        // End revert anchor if slider change denied
        return false;
    };
    // End Event handler /onHashchange/

    // Begin Event handler /onResize/
    onResize = function () {
        if ( stateMap.resize_idto ) { return true; }
        spa.chat.handleResize();
        stateMap.resize_idto = setTimeout(
            function() { stateMap.resize_idto = undefined; },
            configMap.resize_interval
        );
        return true;
    };
    // End Event handler /onResize/

    //--- END EVENT HANDLERS ---

    //--- BEGIN CALLBACKS ---
    // Begin callback method /setChatAnchor/
    // Example: setChatAnchor( 'closed' );
    // Purpose:  Change the chat component of the anchor
    // Arguments:
    //  * position_type - may be 'closed' or 'opened'
    // Action:
    //  Changes the URI anchor parameter 'chat' to the requested
    //  value if possible.
    // Returns:
    //  * true - requested anchor part was updated
    //  * false - requested anchor part was not updated
    // Throws: none
    //
    setChatAnchor = function (position_type) {
        return changeAnchorPart({ chat: position_type });
    };
    // End callback method /setChatAnchor/
    //--- END CALLBACKS ---

    //--- BEGIN PUBLIC METHODS ---
    // Begin PUBLIC method /initModule/
    // Example: spa.shell.initModule( $('#app_div_id') );
    // Purpose:
    //  Directs the Shell to offer its capability to the user
    // Arguments:
    //  * $container (example: $('#app_div_id')).
    //    A jQuery collection that should represent
    //    a single DOM container
    // Action:
    //  Populates $container with the shell of the UI
    //  and then configures and initializes feature modules.
    //  The shell is also responsible for browser-wide issues
    // Returns: none
    // Throws: none
    //
    initModule = function($container) {
        // load HTML and map jQuery collections
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();

        // configure uriAnchor to use our schema
        $.uriAnchor.configModule({
            schema_map: configMap.anchor_schema_map
        });

        // configure and initialize feature modules
        spa.chat.configModule({
            set_chat_anchor: setChatAnchor,
            chat_model: spa.model.chat,
            people_model: spa.model.people
        });
        spa.chat.initModule( jqueryMap.$container );

        // Handle URI anchor change events.
        // This is done /after/ all feature modules are configured
        // and initialized, otherwise they will not be ready to handle
        // the trigger event, which is used to ensure the anchor
        // is considered on-load
        //
        $(window)
            .bind( 'resize', onResize )
            .bind( 'hashchange', onHashchange)
            .trigger( 'hashchange' );

    };
    // End PUBLIC method /initModule/
    //--- END PUBLIC METHODS --

    return {
        initModule: initModule
    };
})();
