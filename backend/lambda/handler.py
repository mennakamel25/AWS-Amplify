import json
import uuid
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
        # Get authenticated user
        # =========================

        claims = event['requestContext']['authorizer']['jwt']['claims']

        user_id = claims['sub']

        logger.info(f"Authenticated user: {user_id}")

        # =========================
        # GET /tasks
        # =========================

        if method == 'GET':

            logger.info("Fetching tasks from DynamoDB")

            response = table.scan(
                FilterExpression='userId = :uid',
                ExpressionAttributeValues={
                    ':uid': user_id
                }
            )

            tasks = response.get('Items', [])

            logger.info(
                f"Tasks returned for user {user_id}: {len(tasks)}"
            )

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
                'taskId': str(uuid.uuid4()),
                'title': body['title'],
                'userId': user_id
            }

            logger.info(
                f"Creating task {task['taskId']} "
                f"for user {user_id}"
            )

            table.put_item(Item=task)

            logger.info("Task successfully stored in DynamoDB")

            return {
                'statusCode': 201,
                'body': json.dumps(task)
            }

        # =========================
        # Unsupported method
        # =========================

        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Unsupported HTTP method'
            })
        }

    except Exception as e:

        logger.exception("Error while processing request")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
