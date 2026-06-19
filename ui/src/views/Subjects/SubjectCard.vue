<template>
    <Card class="w-sm overflow-hidden hover:outline-3 outline-brand-200">
        <!-- <template #header>
            <img src="https://picsum.photos/500/350" alt="foo">
        </template> -->
        <template #title>
            <div class="flex items-start justify-between">
                <div class="subject-title flex items-center gap-1.5">
                    <div class="subject-icon">
                        <Icon :type="subjectIcon(subject.type)" color="white" size="24px"/>
                    </div>
                    <div>
                        <div class="name">{{  subject.name }}</div>
                        <div class="text-sm text-gray-400">{{ startCase(subject.type) }}</div>
                    </div>
                </div>
                <div class="testing-status">
                    <template v-if="!subject.testing_enabled">
                        <Icon type="Content Paste Off" color="red" size="24px"/>
                    </template>
                </div>
            </div>
        </template>
        <template #content>
            <p>{{ subject.description }}</p>
            <ul class="subject-details">
                <li class="flex justify-between">
                    <div class="label">Active / Paused Tests</div>
                    <div class="value">{{ subject.active_tests }}</div>
                </li>
                <li class="flex justify-between">
                    <div class="label">Pending Tests</div>
                    <div class="value">{{ subject.pending_tests }}</div>
                </li>
                <li class="flex justify-between">
                    <div class="label">Complete Tests</div>
                    <div class="value">{{ subject.complete_tests }}</div>
                </li>
            </ul>
        </template>
        <template #footer>
            <div class="flex items-center w-full gap-2">
                <ButtonGroup class="w-full">
                    <Button variant="outlined" class="flex-auto" @click="viewSplitTests(subject)">View Split Tests</Button>
                    <Button v-if="$sessionStore.minRole('tester')" variant="outlined" @click="toggle">
                        <template #icon>
                            <Icon type="More-Horiz" size="20px"/>
                        </template>
                    </Button>
                </ButtonGroup>
                <Menu ref="menu" :model="menu" :popup="true">
                    <template #item="{ item }">
                        <div class="popup-menu-item flex-row">
                            <div :class="['icon-box', item.icon_color]">
                                <Icon :type="item.icon" color="white" size="16px"/>
                            </div>
                             {{ item.label }}
                        </div>
                    </template>
                </Menu>
            </div>
        </template>
    </Card>
</template>

<script lang="ts">
import { startCase } from 'lodash-es';
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'TestSubjectCard',
    props : {
        subject: {
            type: Object,
            required: true
        }
    },
    computed: {
        menu() {
            const menu_items: any[] = [
                { 
                    label: 'Edit Test Subject',
                    icon_color: 'bg-alt-500!',
                    icon: 'Edit',
                    command: this.editSubject
                },
                {
                    label: 'Duplicate Test Subject',
                    icon_color: 'bg-alt-500!',
                    icon: 'Content Copy',
                    command: this.duplicateSubject
                }
            ];

            if (+this.subject.active_tests === 0) {
                menu_items.push({
                    label: 'Delete Test Subject',
                    icon_color: 'bg-red-500!',
                    icon: 'Delete',
                    command: this.deleteSubject 
                });
            }
            else {
                menu_items.push({
                    label: 'Stop Tests to Delete',
                    icon_color: 'bg-gray-400!',
                    icon: 'Delete Forever',
                    command: () => {}
                });
            }

            return menu_items;
        }
    },
    methods: {
        startCase,
        subjectIcon(type: string) {
            switch (type) {
                case 'website':
                    return 'Web';
                    break;
                case 'app':
                    return 'Phone Android';
                    break;
                case 'other':
                    return 'Devices Other';
                    break;
            }
        },
        toggle(event: MouseEvent) {
            const menu_instance = this.$refs.menu as any;
			menu_instance.toggle(event);
		},
        editSubject() {
			this.$router.push(`/subjects/edit/${this.subject.id}`);
		},
        duplicateSubject() {
            this.$router.push(`/subjects/edit/new?duplicate_subject_id=${this.subject.id}`);
        },
		deleteSubject() {
			this.$confirm.require({
				group: 'confirmation',
				header: 'Delete Subject',
				message: `Are you sure you want to delete the subject named <strong>${this.subject.name}</strong>? This may break any tests associated with it and cannot be undone.`,
				acceptProps: {
					severity: 'danger',
					label: 'Delete Subject'
				},
				accept: async () => {
					try {
						await this.$API.delete(`/api/subjects/${this.subject.id}`);
						this.$toast.add({
							severity: 'success',
							summary: 'Subject Deleted',
							detail: `The subject named ${this.subject.name} was successfully deleted`,
							life: 5000
						});
					} catch (err) {
						// Auto handled
					}
					finally {
						this.$emit('delete');
					}
				},
				rejectProps: {
					severity: 'secondary',
					label: 'Cancel',
					outline: true
				}
			});
		},
        viewSplitTests(subject: any) {
			this.$router.push(`/split-tests?subject_id=${subject.id}`);
		}
    }
});
</script>

<style scoped lang="less">
.subject-details {
	border-top: 1px solid var(--color-gray-200);
	margin-top: 1em;
	
	li {
		border-bottom: 1px solid var(--color-gray-200);
		height: 40px;
		line-height: 40px;
		padding: 0 0.5em;
	}
}

.subject-icon {
    align-items: center;
    background-color: var(--color-brand);
    border-radius: 25px;
    display: flex;
    height: 50px;
    justify-content: center;
    width: 50px;
}

:deep(.icon-box) {
    align-items: center;
    background-color: var(--color-alt);
    border-radius: 5px;
    display: flex;
    height: 24px;
    justify-content: center;
    padding: 0.25em;
    width: 24px;
}
</style>