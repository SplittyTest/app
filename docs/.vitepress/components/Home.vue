<template>
    <div id="home">
        <section id="banner">
            <div class="container">
                <div class="grid grid-cols-2">
                    <div class="max-w-[460px]">
                        <div class="brand">
                            <img src="/img/splitty-test-logo.svg" alt="Splitty Test"/>
                        </div>
                        <div class="description">
                            A really simple, developer-friendly platform for split testing things.
                        </div>
                        <div class="ctas">
                            <a href="/learn-more.html" class="btn brand-btn">Learn More</a>
                            <a href="/getting-set-up.html" class="btn secondary-btn">Docs</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section id="license">
            <div class="container">
                <h2>Flexible and Free Licensing</h2>
                <p>Splitty Test features a Source Available licensing model that gives you maximum flexibility and transparency without the high costs. This approach allows you to host and use the complete software for free for almost any purpose, making it an ideal solution for businesses looking to scale their optimization tools without restrictive licensing fees.</p>
                <div class="use-types grid grid-cols-3">
                    <div class="use-type personal">
                        <div class="inline-flex items-center gap-2">
                            <img src="/img/check-icon.svg" alt="Check"/>
                            <span>Personal</span>
                        </div>
                    </div>
                    <div class="use-type non-commercial">
                        <div class="inline-flex items-center gap-2">
                            <img src="/img/check-icon.svg" alt="Check"/>
                            <span>Non-Commercial</span>
                        </div>
                    </div>
                    <div class="use-type commercial">
                        <div class="inline-flex items-center gap-2">
                            <img src="/img/check-icon.svg" alt="Check"/>
                            <span>Commercial</span>
                        </div>
                    </div>
                </div>
                <div class="ctas">
                    <a href="/license" class="btn brand-btn">View the License</a>
                </div>
            </div>
        </section>
        <section id="strategies">
            <div class="container">
                <h2>Two Ways to Test</h2>
                <p>Splitty Test simplifies conversion rate optimization by supporting two distinct styles of experimentation tailored to your campaign goals. Users can choose traditional split testing to manually compare a control against a static variation, or deploy modern auto-optimization to let intelligent algorithms dynamically route traffic to the highest-performing assets in real-time.</p>
                <div class="strategy-types grid grid-cols-2">
                    <div class="standard strategy-type text-left">
                        <h3>Standard</h3>
                        <p class="max-w-[320px]">For those who want to split test the traditional way, flexible configurations allow you full control. Splitty test collects the data and leaves the decision-making to you. </p>
                    </div>
                    <div class="auto-optimized strategy-type text-right">
                        <h3>Auto-Optimized</h3>
                        <p class="justify-self-end max-w-[320px]">Let Splitty Test decide which variations should be shown more often using multi-armed bandit logic for a low maintenance approach. Save time and reduce lost revenue!</p>                        
                    </div>
                </div>
            </div>
        </section>
        <section id="features">
            <div class="container text-center max-w-[850px]!">
                <h2>Useful Features</h2>
                <p>Splitty Test packs plenty of useful features under the hood, but it leaves the unnecessary bloat behind. Instead of overwhelming you with a massive, complicated dashboard, it keeps the spotlight exactly where it belongs: on running clean, effective split tests.</p>
                <div class="feature-boxes">
                    <div class="feature metrics">
                        <img src="/img/metrics-icon.svg" alt="Track Metrics">
                        <h4>Track Metrics</h4>
                        <p>Collect data even when tests aren’t active to get baseline statistics for your data analysis.</p>
                    </div>
                    <div class="feature audiences">
                        <img src="/img/audience-icon.svg" alt="Track Metrics">
                        <h4>Filter Audiences</h4>
                        <p>Decide which tests go to which users or filter out bots and other unwanted traffic.</p>
                    </div>
                    <div class="feature outcomes">
                        <img src="/img/outcomes-icon.svg" alt="Track Metrics">
                        <h4>Log Outcomes</h4>
                        <p>Keep track of which tests won and which tests lost. Takes notes for others to learn from.</p>
                    </div>
                    <div class="feature webhooks">
                        <img src="/img/webhooks-icon.svg" alt="Track Metrics">
                        <h4>Send Webhooks</h4>
                        <p>Trigger external services or notifications based on test results and user interactions.</p>
                    </div>
                </div>
            </div>
        </section>
        <section id="call-to-action">
            <div class="container">
                <h2>Setup Splitty Test Now!</h2>
                <p><strong>Stop guessing. Start converting.</strong> Get going with our app today to launch effortless A/B tests and track user behavior in real time. Your website has traffic—now it's time to maximize it. Download Splitty Test now and start optimizing!</p>
                <p class="action-text">Making the most of your traffic is now easy and affordable!</p>
                <a href="/getting-set-up.html" class="btn accent-btn">View the Docs</a>
            </div>
        </section>
        <section id="footer">
            <div class="container px-5 text-sm">
                <div class="flex items-center justify-between">
                    <div class="left">
                        &copy; 2026 Splitty Test. All rights reserved.
                    </div>
                    <div class="right">
                        <a href="/license.html">License</a> | <a href="/getting-set-up.html">Docs</a> | <a href="mailto:support@splittytest.com">Contact</a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'SplittyTestDocsHome',
    props : {
        
    },
    data() {
        return {};
    }
});
</script>

<style scoped lang="less">
#home {
    border-top: 1px solid #eaeaea;
    font-family: poppins, sans-serif;
    width: 100%;
}

section {
    padding: 4em 0;
}

.container {
    margin: 0 auto;
    max-width: 1200px;
    width: 100%;
}

a {
    text-decoration: none;
}

h2 {
    border-top: 0;
    font-size: 2.5em;
    font-weight: 700;
    margin: 0 0 0.75em;
}

h3 {
    color: #29a1aa;
    font-size: 2em;
    font-weight: 700;
    margin: 0 0 0.5em;
}

h4 {
    color: #333;
    font-size: 1.75em;
    font-weight: 700;
    margin: 0.5em 0 0;
}

.btn {
    border-radius: 30px;
    display: inline-block;
    font-weight: 700;
    height: 60px;
    line-height: 60px;
    padding: 0 3em;
}

.brand-btn {
    background-color: #29a1aa;
    color: #fff;

    &:hover {
        background-color: #207E85;
        color: #fff;
    }
}

.secondary-btn {
    background-color: transparent;
    border: 2px solid #fcb63f;
    color: #fcb63f;

    &:hover {
        background-color: rgba(252, 182, 63, 0.25);
        color: #fcb63f;
    }
}

.accent-btn {
    background-color: #783fa9;
    color: #FFF;

    &:hover {
        background-color: #603287;
        color: #FFF;
    }
}

#banner {
    background-image: url('/img/splash.png');;
    background-position: 70%  center;
    background-repeat: no-repeat;
    background-size: contain;
    margin: 4em;
    
    .brand {
       margin-bottom: 2em;
       max-width: 270px;
    }
    
    .description {
        font-size: 2.625em;
        font-weight: 500;;
        line-height: 1.25em;
    }
    
    .ctas {
        display: flex;
        gap: 1em;
        margin-top: 2em;
    }
}

#license {
    background-color: #F9F9F9;
    text-align: center;

    img {
        height: 40px;
    }

    .use-types {
        margin: 2em 0;
    }

    .use-type {
        font-size: 1.75em;
        font-weight: 500;
    }
}

#strategies {
    .container {
        border-bottom: 1px solid transparent; /* Set your border thickness */
        border-image: linear-gradient(to right, transparent, #eaeaea 20%, #eaeaea 80%, transparent) 1;
        padding-bottom: 5em;
        text-align: center;
    }

    .strategy-types {
        align-items: center;
        display: flex;
        background-image: url('/img/strategy-options.png');
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        height: 400px;
        margin-top: 2em;
    }

    .strategy-type {
        align-items: center;
        width: 100%;
    }
}

#features {
    padding-top: 0;

    .feature-boxes {
        display: grid;
        gap: 60px;
        grid-template-columns: 1fr 1fr;
        margin: 2em auto;
        max-width: 740px;
    }

    .feature {
        align-items: center;
        border-radius: 20px;
        border: 2px solid #29a1aa;
        display: flex;
        flex-direction: column;
        padding: 1rem 2rem;

        img {
            height: 120px;
        }
    }
}

#call-to-action {
    background-color: #f1ecf6;
    border-radius: 20px;
    padding: 3em 4em;
    margin: 0 auto;
    max-width: 1200px;
    text-align: center;

    h2 {
        color: #783fa9;
    }

    .action-text {
        color: #2aa1aa;
        font-weight: 700;
        margin: 2em 0;
    }
}

#footer {
    padding: 1em 0;

    a {
        color: #666;

        &:hover {
            color: #29a1aa;
        }
    }
}

// Tablet (≤ 900px)
@media (max-width: 900px) {
    .container {
        padding: 0 2em;
    }

    h2 {
        font-size: 2em;
    }

    #banner {
        margin: 0;
        background-position: 350px center;

        .description {
            font-size: 2em;
        }
    }

    #license {
        .use-types {
            font-size: 0.75em;
        }
    }

    #strategies {
        .strategy-types {
            background-position: 350px center;
            display: block;
        }

        .auto-optimized {
            margin-top: 2em;
            text-align: left !important;

            p {
                justify-self: start !important;
            }
        }
    }

    #features {
        .feature-boxes {
            gap: 40px;
        }
    }

    #call-to-action {
        margin: 0 2em;
        padding: 2.5em 2.5em;
    }
}

// Mobile (≤ 640px)
@media (max-width: 640px) {
    section {
        padding: 2.5em 0;
    }

    .container {
        padding: 0 1.25em;
    }

    h2 {
        font-size: 1.625em;
    }

    h3 {
        font-size: 1.5em;
    }

    h4 {
        font-size: 1.25em;
    }

    .btn {
        height: 50px;
        line-height: 50px;
        padding: 0 2em;
    }

    #banner {
        background-image: none;
        margin: 1.25em;

        .grid {
            grid-template-columns: 1fr;
        }

        .brand {
            max-width: 200px;
            margin-bottom: 1.25em;
        }

        .description {
            font-size: 1.5em;
        }

        .ctas {
            flex-wrap: wrap;
        }
    }

    #license {
        .use-types {
            grid-template-columns: 1fr;
            gap: 1em;
        }

        .use-type {
            font-size: 1.375em;
        }
    }

    #strategies {
        .strategy-types {
            background-image: none;
            grid-template-columns: 1fr;
            height: auto;
            gap: 2em;
        }

        .strategy-type {
            &.text-right {
                text-align: left;
            }

            p {
                max-width: 100% !important;
            }
        }
    }

    #features {
        .feature-boxes {
            grid-template-columns: 1fr;
            gap: 1.5em;
            max-width: 100%;
        }

        .feature {
            img {
                height: 80px;
            }
        }
    }

    #call-to-action {
        border-radius: 12px;
        padding: 2em 1.5em;
        margin: 0 1.25em;
        max-width: calc(100% - 2.5em);
    }

    #footer {
        .flex {
            flex-direction: column;
            gap: 0.75em;
            text-align: center;
        }
    }
}

.dark {
    #license {
        background-color: #333;
        color: #f9f9f9;

        .use-type {
            color: #f9f9f9;
        }
    }

    #features {
        h4 {
            color: #f9f9f9;
        }
    }

    #call-to-action {
        background-color: #333333;

        h2 {
            color: #f1ecf6;
        }

        .action-text {
            color: #f1ecf6;
        }
    }

    #footer {
        a {
            color: #f9f9f9;

            &:hover {
                color: #29a1aa;
            }
        }
    }
}
</style>