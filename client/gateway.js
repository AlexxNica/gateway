/**
 * Client to connect to a darkwallet gateway.
 *
 * @param {String}   connect_uri Gateway websocket URI
 * @param {Function} handle_connect Callback to run when connected
 */
function GatewayClient(connect_uri, handle_connect) {
    var self = this;
    this.handler_map = {};
    this.websocket = new WebSocket(connect_uri);
    this.websocket.onopen = function(evt) {
        handle_connect();
    };
    this.websocket.onclose = function(evt) {
        self.on_close(evt);
    };
    this.websocket.onerror = function(evt) {
        self.on_error(evt);
    };
    this.websocket.onmessage = function(evt) {
        self._on_message(evt);
    };
}

/**
 * Get last height
 *
 * @param {Function} handle_fetch Callback to handle the returned height
 */
GatewayClient.prototype.fetch_last_height = function(handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_last_height", [], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

/**
 * Fetch transaction
 *
 * @param {String}   tx_hash Transaction identifier hash
 * @param {Function} handle_fetch Callback to handle the JSON object
 * representing the transaction 
 */
GatewayClient.prototype.fetch_transaction = function(tx_hash, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_transaction", [tx_hash], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

/**
 * Fetch history
 *
 * @param {String}   address
 * @param {Function} handle_fetch Callback to handle the JSON object
 * representing the history of the address
 */
GatewayClient.prototype.fetch_history = function(address, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_history", [address], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

/**
 * Subscribe
 *
 * @param {String}   address
 * @param {Function} handle_fetch Callback to handle subscription result
 * @param {Function} handle_update Callback to handle the JSON object
 * representing for updates
 */
GatewayClient.prototype.subscribe = function(
    address, handle_fetch, handle_update)
{
    var self = this;
    this.make_request("subscribe_address", [address], function(response) {
        handle_fetch(response["error"], response["result"][0]);
        if (handle_update) {
            self.handler_map["update." + address] = handle_update;
        }
    });
}

GatewayClient.prototype.fetch_block_header = function(index, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_block_header", [index], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

GatewayClient.prototype.fetch_block_transaction_hashes = function(
    index, handle_fetch)
{
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_block_transaction_hashes", [index],
        function(response) {
            handle_fetch(response["error"], response["result"][0]);
        });
};

GatewayClient.prototype.fetch_spend = function(outpoint, handle_fetch) {
    GatewayClient._check_function(handle_fetch);

    this.make_request("fetch_spend", [outpoint], function(response) {
        handle_fetch(response["error"], response["result"][0]);
    });
};

/**
 * Renew
 *
 * @param {String}   address
 * @param {Function} handle_fetch Callback to handle subscription result
 * @param {Function} handle_update Callback to handle the JSON object
 * representing for updates
 */
GatewayClient.prototype.renew = function(address, handle_fetch, handle_update)
{
    var self = this;
    this.make_request("renew_address", [address], function(response) {
        handle_fetch(response["error"], response["result"][0]);
        if (handle_update) {
            self.handler_map["update."+address] = handle_update;
        }
    });
}

/**
 * Make requests to the server
 *
 * @param {String} command
 * @param {Array} params
 * @param {Function} handler 
 */
GatewayClient.prototype.make_request = function(command, params, handler) {
    GatewayClient._check_function(handler);

    var id = GatewayClient._random_integer();
    var request = {
        "id": id,
        "command": command,
        "params": params
    };
    var message = JSON.stringify(request);
    this.websocket.send(message);
    this.handler_map[id] = handler;
};

/**
 * Close event handler
 *
 * @param {Object} evt event
 */
GatewayClient.prototype.on_close = function(evt) {
};

/**
 * Error event handler
 *
 * @param {Object} evt event
 *
 * @throws {Object}
 */
GatewayClient.prototype.on_error = function(evt) {
    throw evt;
};

/**
 * After triggering message event, calls to the handler of the petition
 *
 * @param {Object} evt event
 * @private
 */
GatewayClient.prototype._on_message = function(evt) {
    this.on_message(evt)
    response = JSON.parse(evt.data);
    id = response.id;
    // Should be a separate map entirely. This is a hack.
    if (response.name == "update")
        id = "update." + response.address;
    // Prefer flat code over nested.
    if (!this.handler_map[id]) {
        console.log("Handler not found");
        return;
    }
    handler = this.handler_map[id];
    handler(response);
};

/**
 * Message event handler
 *
 * @param {Object} evt event
 */
GatewayClient.prototype.on_message = function(evt) {
}

/**
 * (Pseudo-)Random integer generator
 *
 * @return {Number} Random integer
 * @private
 */
GatewayClient._random_integer = function() {
    return Math.floor((Math.random() * 4294967296)); 
};

/**
 * Checks if param can be executed
 *
 * @param {Function} Function to be checked
 *
 * @throws {String} Parameter is not a function
 * @protected
 */
GatewayClient._check_function = function(func) {
    if (typeof func !== 'function') {
        throw "Parameter is not a function";
    }
};

