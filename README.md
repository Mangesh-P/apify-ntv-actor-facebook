## Getting started

For complete information [see this article](https://docs.apify.com/platform/actors/development#build-actor-locally). To run the actor use the following command: run apify locally


For input add below in "storage/key_value_stores/default/INPUT.json"
Change the input as needed.

{
    "url": "https://nativo.com",
    "proxy": {
        "useApifyProxy": true
    }
}


After successful running the output can be found in 
"storage/key_value_stores/default/OUTPUT.json"

```
apify run
```

## Deploy to Apify

### Connect Git repository to Apify

If you've created a Git repository for the project, you can easily connect to Apify:

1. Go to [Actor creation page](https://console.apify.com/actors/new)
2. Click on **Link Git Repository** button

### Push project on your local machine to Apify

You can also deploy the project on your local machine to Apify without the need for the Git repository.

1. Log in to Apify. You will need to provide your [Apify API Token](https://console.apify.com/account/integrations) to complete this action.

    ```
    apify login
    ```

2. Deploy your Actor. This command will deploy and build the Actor on the Apify Platform. You can find your newly created Actor under [Actors -> My Actors](https://console.apify.com/actors?tab=my).
MAKE SURE TO DELETE PACKAGE-LOCK.JSON BEFORE PUSHING.

    ```
    apify push
    ```
