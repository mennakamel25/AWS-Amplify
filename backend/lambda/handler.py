import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Tasks')


def lambda_handler(event, context):

    try:

        method = event['requestContext']['http']['method']

        logger.info(f"HTTP Method: {method}")

        # =========================
        # GET /tasks
        # =========================

        if method == 'GET':

            logger.info("Fetching tasks from DynamoDB")

            response = table.scan()

            tasks = response.get('Items', [])

            logger.info(f"Tasks returned: {len(tasks)}")

            return {
                'statusCode': 200,
                'body': json.dumps(tasks)
            }

        # =========================
        # POST /tasks
        # =========================

        elif method == 'POST':

            logger.info("Creating new task")

            body = json.loads(event['body'])

            task = {
                'taskId': body['taskId'],
                'title': body['title']
            }

            logger.info(f"Creating task: {task['taskId']}")

            table.put_item(Item=task)

            logger.info("Task successfully stored in DynamoDB")

            return {
                'statusCode': 201,
                'body': json.dumps(task)
            }

        return {
            'statusCode': 400,
            'body': json.dumps('Unsupported HTTP method')
        }

    except Exception as e:

        logger.exception("Error while processing request")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
