const config = require('../config/sevice_config')

module.exports = [
    /**
     * Configuration for console logging
     */
    {
        type: 'console',
        
        // specify options here
        config: {
            service: config.SERVICE_NAME + '-' + config.SERVICE_VERSION + '.' + config.BUILD_NUMBER,
            syslog: true
        }
    },

    /**
     * Configuration for file logging
     */
    {
        type: "file-rotate",

        // specify options here
        config: {
            service: config.SERVICE_NAME + '-' + config.SERVICE_VERSION + '.' + config.BUILD_NUMBER,
            syslog: true,
            filename: `${config.SERVICE_NAME}.log`,
            dirname: './log'
        }
    },

    /**
     * Slack logging
     */

    /*
    {
        type: 'slack',
        config: {
            service: config.SERVICE_NAME,
            webhookUrl: 'https://hooks.slack.com/services/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',
            username: 'MY APP'
        }
    }
    */
]
